
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generateAIResponse } from './services/aiService.js';
import { getWhatsAppProvider } from './services/whatsapp/index.js';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Improved CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://zap-ai-master.vercel.app',
    'https://zap-ai-master-7vtlsuerz-paulo207-projects.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('localhost')) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes

// Get all conversations
app.get('/api/conversations', async (req, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Update conversation status (active/human)
app.patch('/api/conversations/:phone/status', async (req, res) => {
    const { phone } = req.params;
    const { status } = req.body;

    try {
        const conversation = await prisma.conversation.update({
            where: { phone },
            data: { status }
        });
        res.json(conversation);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// --- SETTINGS API ---
app.get('/api/settings/:key', async (req, res) => {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: req.params.key }
        });
        res.json(setting ? JSON.parse(setting.value) : null);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const value = JSON.stringify(req.body);

        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });


        // If updating WhatsApp Config, try to sync Webhook with Provider
        if (key === 'whatsapp_config') {
            try {
                // Config is in req.body
                const newConfig = req.body;
                if (newConfig.webhookUrl) {
                    // Force get provider (it will reload from DB as hash changed)
                    const provider = await getWhatsAppProvider();
                    if (provider && typeof provider.updateWebhook === 'function') {
                        console.log('🔄 Auto-syncing Webhook to Provider...');
                        await provider.updateWebhook(newConfig.webhookUrl);
                    }
                }
            } catch (syncError) {
                console.error('⚠️ Failed to auto-sync webhook:', syncError);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Get messages for a specific conversation
app.get('/api/conversations/:phone/messages', async (req, res) => {
    const { phone } = req.params;
    try {
        // First find the conversation ID by phone
        const conversation = await prisma.conversation.findUnique({
            where: { phone }
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { timestamp: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        console.error(`Error fetching messages for ${phone}:`, error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message via Provider
app.post('/api/messages/send', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
    }

    try {
        const provider = await getWhatsAppProvider();
        const cleanNumber = phone.replace(/\D/g, '');

        // 1. Send via Provider
        await provider.sendMessage(cleanNumber, message);

        // 2. Find or Create Conversation (Prisma)
        let conversation = await prisma.conversation.findUnique({
            where: { phone: cleanNumber }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    phone: cleanNumber,
                    name: cleanNumber, // Default name
                    status: 'active'
                }
            });
        } else {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() }
            });
        }

        // 3. Save to Database
        const savedMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: message,
                fromMe: true,
                type: 'text'
            }
        });

        res.json({ success: true, message: savedMessage });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
});

// --- HELPER: Sync Contacts ---
async function syncContacts() {
    try {
        const provider = await getWhatsAppProvider();
        console.log('🔄 Auto-syncing contacts from provider...');
        const providerContacts = await provider.getContacts();

        console.log(`Provider returned ${providerContacts.length} contacts.`);

        let successCount = 0;
        let failCount = 0;

        for (const c of providerContacts) {
            try {
                let rawPhone = c.phone || c.number || c.id;
                if (!rawPhone) { failCount++; continue; }

                let cleanPhone = rawPhone.toString().replace(/@c\.us$/, '').replace(/@s\.whatsapp\.net$/, '');
                const name = c.name || c.pushname || c.notifyName || c.shortName || cleanPhone;
                const profilePicUrl = c.profilePicUrl || c.image || c.imgUrl || null;

                if (c.isGroup) continue;
                if (cleanPhone === 'status' || cleanPhone.includes('broadcast')) continue;

                await prisma.contact.upsert({
                    where: { phone: cleanPhone },
                    update: { name: name, profilePicUrl: profilePicUrl },
                    create: { phone: cleanPhone, name: name, profilePicUrl: profilePicUrl }
                });
                successCount++;
            } catch (err) {
                failCount++;
            }
        }
        console.log(`✅ Synced ${successCount} contacts.`);
        return { success: true, count: successCount };
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error };
    }
}

// Webhook Handler for Z-API
app.post('/api/webhook/message', async (req, res) => {
    try {
        // console.log('[Webhook] Received:', JSON.stringify(req.body, null, 2));
        const body = req.body;

        // --- DETECT CONNECTION EVENT ---
        // Z-API: { type: "status-change", status: "connected" } 
        // OR { phone: "...", status: "CONNECTED" } depending on version
        const isConnectedEvent =
            (body.type === 'status-change' && body.status === 'connected') ||
            (body.status === 'CONNECTED');

        if (isConnectedEvent) {
            console.log('🔌 Device Connected! Triggering Auto-Sync...');
            // Run in background (dont block webhook response)
            syncContacts().then(() => console.log('Background Sync Finished'));
            return res.json({ success: true, action: 'sync_started' });
        }

        // Determine payload structure
        let phone, content, name, messageId, fromMe = false;

        // 1. UltraMsg Structure
        if (body.data && body.event_type === 'message_received') {
            const msg = body.data;
            phone = msg.from.replace('@c.us', '');
            content = msg.body;
            name = msg.pushname || msg.notifyName || phone;
            messageId = msg.id;
            fromMe = msg.fromMe;
        }
        // 2. Z-API Structure (Standard Message)
        else if (body.phone && body.message && (body.message.text || body.text)) {
            phone = body.phone;
            content = body.message.text || body.text?.message || body.message;
            name = body.pushName || body.name || phone;
            messageId = body.messageId || body.message?.id;
            fromMe = body.fromMe || false;
        }
        // 3. Fallback/Simplified Structure
        else if (body.phone && (body.content || body.message)) {
            phone = body.phone;
            content = body.content || body.message;
            name = body.name || phone;
            fromMe = body.fromMe || false;
        }

        if (!phone || !content) {
            // Quietly ignore non-message events
            return res.status(200).json({ status: 'ignored' });
        }

        // Ignore Groups and Broadcasts
        if (phone.includes('@g.us') || phone.includes('broadcast')) {
            return res.status(200).json({ status: 'ignored_group' });
        }

        // Ignore Broadcasts or Status Updates
        if (phone === 'status' || phone.includes('@broadcast')) {
            return res.status(200).json({ status: 'ignored_broadcast' });
        }

        const cleanNumber = phone.replace(/\D/g, '');

        let conversation = await prisma.conversation.findUnique({
            where: { phone: cleanNumber }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    phone: cleanNumber,
                    name: name,
                    status: 'active'
                }
            });
            // New conversation? Maybe sync this specific contact? 
            // For now, let's leave global sync for connection.
        } else {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() }
            });
        }

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                content: typeof content === 'string' ? content : JSON.stringify(content),
                fromMe: false, // Webhooks are incoming messages
                type: 'text'
            }
        });

        console.log('[Webhook] Message saved:', message.id);

        // --- AI AUTO-REPLY LOGIC ---
        // 1. Fetch Global AI Config
        const aiSetting = await prisma.systemSetting.findUnique({ where: { key: 'zapai_ai_config' } });
        const aiConfig = aiSetting ? JSON.parse(aiSetting.value) : { enabled: true };

        // 2. Only reply if message is from USER (not from me/bot), status is active AND global agent is enabled
        if (!message.fromMe && conversation.status === 'active' && aiConfig.enabled !== false) {
            // ... existing AI logic ...
            // (Logic continues below, verifying context bounds)
            console.log('🤖 Triggering AI for conversation:', conversation.phone);
            const history = await prisma.message.findMany({
                where: { conversationId: conversation.id },
                orderBy: { timestamp: 'desc' },
                take: 10
            });
            const chronologicalHistory = history.reverse();
            let aiResponseText = await generateAIResponse(content, chronologicalHistory);

            // 2.1 Check for Appointment Marker
            // Regex updated to support newlines/multiline JSON: ([\s\S]*?)
            const appointmentMatch = aiResponseText.match(/\|\|AGENDAMENTO:\s*({[\s\S]*?})\s*\|\|/);

            if (appointmentMatch && appointmentMatch[1]) {
                try {
                    console.log("[Appt Parser] Found marker:", appointmentMatch[1]);
                    const apptData = JSON.parse(appointmentMatch[1]);
                    // Clean the text sent to user (remove the hidden JSON)
                    aiResponseText = aiResponseText.replace(appointmentMatch[0], '').trim();
                    await prisma.appointment.create({
                        data: {
                            phone: conversation.phone,
                            client: apptData.client || conversation.name || 'Cliente',
                            service: apptData.service || 'Serviço não especificado',
                            date: apptData.date || 'Data não especificada'
                        }
                    });
                    console.log("📅 Appointment saved");

                    // Notify Admin
                    const setting = await prisma.systemSetting.findUnique({ where: { key: 'zapai_ai_config' } });
                    if (setting) {
                        const config = JSON.parse(setting.value);
                        if (config.adminPhone) {
                            const provider = await getWhatsAppProvider();
                            const adminMsg = `🔔 *NOVO AGENDAMENTO*\n👤 ${apptData.client}\n📅 ${apptData.date}`;
                            await provider.sendMessage(config.adminPhone, adminMsg);
                        }
                    }
                } catch (e) { console.error("Appt Error", e); }
            }

            // Send Response
            try {
                const provider = await getWhatsAppProvider();
                await provider.sendMessage(conversation.phone, aiResponseText);
            } catch (err) { console.error("Send Error", err); }

            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    content: aiResponseText,
                    fromMe: true,
                    type: 'text'
                }
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

// Get All Contacts
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await prisma.contact.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Sync Contacts (Provider -> DB)
app.post('/api/contacts/sync', async (req, res) => {
    const result = await syncContacts();
    if (result.success) {
        res.json({ success: true, count: result.count, message: 'Sincronização concluída via API.' });
    } else {
        res.status(500).json({ error: 'Failed to sync contacts' });
    }
});

// Manually Create Contact
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, phone, email, tags } = req.body;

        if (!phone) return res.status(400).json({ error: 'Phone is required' });

        const contact = await prisma.contact.create({
            data: {
                phone,
                name: name || phone,
                email,
                tags: tags || []
            }
        });
        res.json(contact);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Este número já está cadastrado.' });
        }
        console.error('Create contact failed:', error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

// --- APPOINTMENTS API ---
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(appointments);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.put('/api/appointments/:id', async (req, res) => {
    try {
        const { completed } = req.body;
        const appt = await prisma.appointment.update({
            where: { id: req.params.id },
            data: { completed }
        });
        res.json(appt);
    } catch (e) {
        res.status(500).json({ error: 'Failed update' });
    }
});

// Delete Appointment
app.delete('/api/appointments/:id', async (req, res) => {
    try {
        await prisma.appointment.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to delete appointment:', e);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// --- STATS API ---
app.get('/api/stats/messages-by-day', async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch messages from last 7 days
        const messages = await prisma.message.findMany({
            where: {
                timestamp: {
                    gte: sevenDaysAgo
                }
            },
            select: {
                timestamp: true
            }
        });

        // Initialize last 7 days map
        const daysMap = new Map();
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const label = daysOfWeek[d.getDay()];
            daysMap.set(key, { name: label, msgs: 0, date: key });
        }

        // Aggregate counts
        messages.forEach(msg => {
            const dateKey = msg.timestamp.toISOString().split('T')[0];
            if (daysMap.has(dateKey)) {
                daysMap.get(dateKey).msgs++;
            }
        });

        const graphData = Array.from(daysMap.values());
        res.json(graphData);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Start Server


// Get Current WhatsApp Status
app.get('/api/status', async (req, res) => {
    try {
        const provider = await getWhatsAppProvider();
        const status = await provider.checkConnection();
        res.json(status);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// Get QR Code
app.get('/api/qr', async (req, res) => {
    try {
        const provider = await getWhatsAppProvider();
        const qrData = await provider.getQrCode();

        if (!qrData) {
            console.error('[QR] Provider returned null/undefined');
            return res.status(404).json({ error: 'QR Code not available' });
        }

        // Handle Status Message (e.g. "Already Connected")
        if (typeof qrData === 'object' && qrData.status === 'connected') {
            console.log('[QR] Device already connected');
            return res.json({ status: 'connected', message: qrData.message });
        }

        // Handle Buffer (Direct Image)
        if (Buffer.isBuffer(qrData)) {
            console.log('[QR] Sending buffer image');
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', qrData.length);
            return res.send(qrData);
        }

        // Handle URL (Fetch and Send Buffer)
        else if (typeof qrData === 'string' && qrData.startsWith('http')) {
            console.log('[QR] Fetching image from URL:', qrData);
            const response = await fetch(qrData);

            if (!response.ok) {
                throw new Error(`Failed to fetch QR image: ${response.status} ${response.statusText}`);
            }

            // Get the buffer from the response
            const buffer = await response.buffer();
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', buffer.length);
            return res.send(buffer);
        }

        // Handle Base64
        else if (typeof qrData === 'string' && qrData.startsWith('data:')) {
            console.log('[QR] Processing base64 image');
            const matches = qrData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const type = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                res.setHeader('Content-Type', type);
                res.setHeader('Content-Length', buffer.length);
                return res.send(buffer);
            } else {
                console.error('[QR] Invalid base64 format');
                return res.status(500).json({ error: 'Invalid base64 QR' });
            }
        }
        else {
            console.error('[QR] Unknown QR format:', typeof qrData);
            return res.status(500).json({ error: 'Unknown QR format', dataType: typeof qrData });
        }

    } catch (error) {
        console.error('[QR] Error fetching QR:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch QR code',
            details: error.message
        });
    }
});

// Restart Instance
app.get('/api/restart', async (req, res) => {
    try {
        const provider = await getWhatsAppProvider();
        await provider.restart();
        res.json({ success: true, message: 'Instance restarting...' });
    } catch (error) {
        console.error('Restart failed:', error);
        res.status(500).json({ error: 'Failed to restart instance' });
    }
});

// Disconnect Instance
app.get('/api/logout', async (req, res) => {
    try {
        const provider = await getWhatsAppProvider();
        await provider.logout();
        res.json({ success: true, message: 'Instance disconnected' });
    } catch (error) {
        console.error('Logout failed:', error);
        res.status(500).json({ error: 'Failed to logout instance' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});

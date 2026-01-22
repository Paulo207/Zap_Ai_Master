
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('🚀 Starting Automated Tests...\n');

    // 1. Health Check
    try {
        console.log('1️⃣  Testing Health Check...');
        const health = await fetch(`${BASE_URL}/health`);
        const healthData = await health.json();
        console.log('   ✅ Backend is running:', healthData);
    } catch (error) {
        console.error('   ❌ Backend is NOT running or unreachable.', error);
        return;
    }

    // 2. Simulate Incoming Webhook
    try {
        console.log('\n2️⃣  Simulating Incoming Message via Webhook...');
        const webhookPayload = {
            phone: "5511999999999",
            message: {
                text: "Teste Automático de Recebimento"
            },
            name: "Test User"
        };

        const webhook = await fetch(`${BASE_URL}/api/webhook/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
        });

        const webhookRes = await webhook.json();
        if (webhook.ok) {
            console.log('   ✅ Webhook received and processed successfully.');
        } else {
            console.error('   ❌ Webhook failed:', webhookRes);
        }
    } catch (error) {
        console.error('   ❌ Webhook request failed:', error);
    }

    // 3. Simulate Outgoing Message
    try {
        console.log('\n3️⃣  Testing Outgoing Message API...');
        const sendPayload = {
            phone: "5511999999999",
            message: "Teste Automático de Envio"
        };

        const send = await fetch(`${BASE_URL}/api/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sendPayload)
        });

        const sendRes = await send.json();
        if (send.ok) {
            console.log('   ✅ Backend accepted the message for sending.');
            console.log('   ℹ️  Z-API Response:', sendRes);
        } else {
            console.warn('   ⚠️ Backend attempted to send, but Z-API might have rejected (Expected if not connected):');
            console.warn('      Error:', sendRes);
        }
    } catch (error) {
        console.error('   ❌ Send API request failed:', error);
    }

    console.log('\n🏁 Tests Completed.');
}

runTests();

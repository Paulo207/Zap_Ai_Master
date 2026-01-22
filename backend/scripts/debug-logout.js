
import { PrismaClient } from '@prisma/client';
import { UltraMsgProvider } from './services/whatsapp/ultramsg.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const colors = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m" };

async function debugLogout() {
    console.log(`${colors.yellow}=== DEBUGGING LOGOUT ===${colors.reset}`);

    // 1. Load config
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'whatsapp_config' } });
    if (!setting) { console.log("No config found"); return; }

    const config = JSON.parse(setting.value);
    console.log(`Provider: ${config.provider}, Instance: ${config.instanceId}`);

    if (config.provider !== 'ultramsg') {
        console.log("Not UltraMsg. Shipping.");
        return;
    }

    const provider = new UltraMsgProvider(config);

    // 2. Check Status Before
    console.log("Checking status BEFORE logout...");
    const statusBefore = await provider.checkConnection();
    console.log("Status:", statusBefore);

    // 3. Attempt Logout
    console.log("\nAttempting Logout...");
    try {
        const url = `${provider.baseUrl}/instance/logout`;
        const params = new URLSearchParams();
        params.append('token', provider.token);

        // Try direct fetch to log everything
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const text = await response.text();
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Body: ${text}`);

    } catch (e) {
        console.error("Logout Error:", e);
    }

    // 4. Wait a bit
    await new Promise(r => setTimeout(r, 3000));

    // 5. Check Status After
    console.log("\nChecking status AFTER logout...");
    const statusAfter = await provider.checkConnection();
    console.log("Status:", statusAfter);
}

debugLogout().finally(() => prisma.$disconnect());

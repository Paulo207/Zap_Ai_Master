
import { PrismaClient } from '@prisma/client';
import { UltraMsgProvider } from './services/whatsapp/ultramsg.js';
import { ZAPIProvider } from './services/whatsapp/zapi.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

async function debugQr() {
    console.log(`${colors.blue}=== DEBUGGING QR CODE GENERATION ===${colors.reset}`);

    // 1. Fetch Config from DB
    console.log("Fetching configuration from Database...");
    let config = null;
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'whatsapp_config' }
        });
        if (setting) {
            config = JSON.parse(setting.value);
            console.log(`Found DB Config! Active Provider: ${colors.green}${config.provider}${colors.reset}`);
            console.log(`Config Details: Instance=${config.instanceId}, Token=${config.token?.substring(0, 5)}...`);
        } else {
            console.log(`${colors.yellow}No DB Config found. Using Environment Variables.${colors.reset}`);
            config = {
                provider: 'zapi', // Default fallback
                instanceId: process.env.ZAPI_INSTANCE_ID,
                token: process.env.ZAPI_TOKEN,
                clientToken: process.env.ZAPI_CLIENT_TOKEN
            };
        }
    } catch (e) {
        console.error(`${colors.red}DB Error:${colors.reset}`, e);
        return;
    }

    // 2. Instantiate Provider
    let provider = null;
    if (config.provider === 'ultramsg') {
        provider = new UltraMsgProvider(config);
    } else {
        provider = new ZAPIProvider(config);
    }

    // 3. Check Connection First
    console.log("\nChecking Connection Status...");
    try {
        const status = await provider.checkConnection();
        console.log("Raw Status Response:", status);
    } catch (e) {
        console.error(`${colors.red}Status Check Failed:${colors.reset}`, e.message);
    }

    // 4. Request QR Code
    console.log("\nRequesting QR Code...");
    try {
        const qr = await provider.getQrCode();
        if (qr) {
            console.log(`${colors.green}SUCCESS! QR Data Retrieved:${colors.reset}`);
            console.log("Type:", typeof qr);
            console.log("Length:", qr.length);
            console.log("Preview:", qr.substring(0, 100));

            if (qr.startsWith('http')) {
                console.log("\nAttempting to fetch image from URL...");
                const res = await fetch(qr);
                console.log("Image Fetch Status:", res.status, res.statusText);
                console.log("Content-Type:", res.headers.get('content-type'));
            }
        } else {
            console.log(`${colors.red}FAILED: QR Data is null or empty.${colors.reset}`);
        }
    } catch (e) {
        console.error(`${colors.red}QR Request Failed:${colors.reset}`, e);
    }
}

debugQr().finally(() => prisma.$disconnect());

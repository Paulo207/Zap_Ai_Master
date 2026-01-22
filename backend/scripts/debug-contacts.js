
import { PrismaClient } from '@prisma/client';
import { UltraMsgProvider } from './services/whatsapp/ultramsg.js';
import { ZAPIProvider } from './services/whatsapp/zapi.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const colors = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m" };

async function debugContacts() {
    console.log(`${colors.yellow}=== DEBUGGING CONTACTS ===${colors.reset}`);

    // 1. Load config
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'whatsapp_config' } });
    if (!setting) {
        console.log("No config found in DB, using env?");
        // Fallback checks would go here normally
        return;
    }

    const config = JSON.parse(setting.value);
    console.log(`Provider: ${config.provider}, Instance: ${config.instanceId}`);

    let provider;
    if (config.provider === 'ultramsg') provider = new UltraMsgProvider(config);
    else if (config.provider === 'zapi') provider = new ZAPIProvider(config);
    else { console.log("Unknown provider"); return; }

    // 2. Fetch Contacts
    console.log("Fetching contacts...");
    try {
        const contacts = await provider.getContacts();
        console.log(`Result Type: ${typeof contacts}`);
        console.log(`Is Array? ${Array.isArray(contacts)}`);

        if (Array.isArray(contacts)) {
            console.log(`Count: ${contacts.length}`);
            if (contacts.length > 0) {
                console.log("First contact sample:", contacts[0]);
            }
        } else {
            console.log("Raw Result:", contacts);
        }

    } catch (e) {
        console.error("Method threw error:", e);
    }
}

debugContacts().finally(() => prisma.$disconnect());

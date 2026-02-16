
import { PrismaClient } from '@prisma/client';
import { ZAPIProvider } from './zapi.js';
import { UltraMsgProvider } from './ultramsg.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

let cachedProvider = null;
let lastConfigHash = '';

export const getWhatsAppProvider = async () => {
    // 1. Try Config from DB
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'whatsapp_config' }
        });

        if (setting) {
            const config = JSON.parse(setting.value);
            const currentHash = JSON.stringify(config);

            // Simple caching optimization
            if (cachedProvider && lastConfigHash === currentHash) {
                return cachedProvider;
            }

            console.log(`🔄 Switching WhatsApp Provider to: ${config.provider}`);
            lastConfigHash = currentHash;

            if (config.provider === 'zapi' || config.provider === 'official') {
                cachedProvider = new ZAPIProvider(config);
            } else if (config.provider === 'ultramsg') {
                cachedProvider = new UltraMsgProvider(config);
            } else {
                console.warn(`Unknown provider ${config.provider}, falling back to env.`);
            }

            if (cachedProvider) return cachedProvider;
        }
    } catch (e) {
        console.error("Failed to load WA config from DB", e);
    }

    // 2. Fallback to Environment Variables
    if (!cachedProvider) {
        const providerName = process.env.WHATSAPP_PROVIDER || 'zapi';
        console.log(`⚠️ Falling back to ENV config (Provider: ${providerName})`);

        if (providerName === 'ultramsg') {
            cachedProvider = new UltraMsgProvider({
                instanceId: process.env.ULTRAMSG_INSTANCE_ID,
                token: process.env.ULTRAMSG_TOKEN
            });
        } else {
            cachedProvider = new ZAPIProvider({
                instanceId: process.env.ZAPI_INSTANCE_ID || process.env.VITE_ZAPI_INSTANCE_ID,
                token: process.env.ZAPI_TOKEN || process.env.VITE_ZAPI_TOKEN,
                clientToken: process.env.ZAPI_CLIENT_TOKEN || process.env.VITE_ZAPI_CLIENT_TOKEN,
                apiHost: process.env.WHATSAPP_API_HOST
            });
        }
    }

    return cachedProvider;
};

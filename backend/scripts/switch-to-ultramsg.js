
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function switchToUltraMsg() {
    console.log('🔄 Mudando provedor para UltraMsg...');

    const config = {
        provider: 'ultramsg',
        instanceId: 'instance142899',
        token: 'yjj9hzzyiibozyva',
        webhookUrl: 'https://phylicia-fiddling-erna.ngrok-free.dev/api/webhook/message'
    };

    try {
        const value = JSON.stringify(config);
        await prisma.systemSetting.upsert({
            where: { key: 'whatsapp_config' },
            update: { value },
            create: { key: 'whatsapp_config', value }
        });

        console.log('✅ Configuração atualizada para UltraMsg!');
        console.log(JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

switchToUltraMsg();

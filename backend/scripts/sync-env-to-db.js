
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function sync() {
    console.log('🔄 Sincronizando credenciais do .env com o Banco de Dados...');

    const config = {
        provider: 'zapi',
        instanceId: process.env.ZAPI_INSTANCE_ID,
        token: process.env.ZAPI_TOKEN,
        clientToken: process.env.ZAPI_CLIENT_TOKEN
    };

    if (!config.instanceId || !config.token) {
        console.error('❌ Erro: ZAPI_INSTANCE_ID ou ZAPI_TOKEN não encontrados no .env');
        process.exit(1);
    }

    try {
        const value = JSON.stringify(config);
        await prisma.systemSetting.upsert({
            where: { key: 'whatsapp_config' },
            update: { value },
            create: { key: 'whatsapp_config', value }
        });

        console.log('✅ Configuração "whatsapp_config" atualizada com sucesso no banco de dados!');
        console.log('Configuração aplicada:', JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('❌ Falha ao atualizar banco de dados:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sync();

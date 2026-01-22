
import { PrismaClient } from '@prisma/client';

async function importTraining() {
    const prisma = new PrismaClient();
    try {
        console.log("Reading current config...");
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'zapai_ai_config' }
        });

        let config = {};
        if (setting && setting.value) {
            config = JSON.parse(setting.value);
        }

        // Initialize if missing
        if (!config.trainingExamples) config.trainingExamples = [];

        // The New Examples derived from User Chat Log
        const newExamples = [
            {
                id: "chat_ex_1",
                userQuery: "Olá, bom dia!",
                expectedResponse: "Bom dia! 😊\nSeja bem-vinda à Francisca Nails.\nComo posso te ajudar hoje? ✨"
            },
            {
                id: "chat_ex_2",
                userQuery: "Queria saber se vocês têm horário essa semana",
                expectedResponse: "Claro! 💕\nVocê poderia me dizer qual serviço deseja, dia e horário aproximado que prefere?"
            },
            {
                id: "chat_ex_3",
                userQuery: "Manicure com esmaltação em gel, de preferência na sexta à tarde",
                expectedResponse: "Perfeito! 💅✨\nNa sexta-feira temos disponibilidade às 14h, 15h30 ou 17h.\nQual desses horários fica melhor para você?"
            },
            {
                id: "chat_ex_4",
                userQuery: "15h30 está ótimo",
                expectedResponse: "Ótima escolha 😊\nVou confirmar seu agendamento:\n\n📌 Serviço: Manicure com esmaltação em gel\n📅 Data: Sexta-feira\n⏰ Horário: 15h30\n\nPode me informar seu nome completo, por favor?"
            },
            {
                id: "chat_ex_5",
                userQuery: "Ana Paula Souza",
                expectedResponse: "Obrigada, Ana Paula 💖\nSeu horário está confirmado com sucesso! ✅\n\n📍 Nosso endereço é:\nRua Exemplo, nº 123 – Centro\n\nSe precisar remarcar ou tiver alguma dúvida, é só nos chamar 😉\nSerá um prazer te atender ✨"
            },
            {
                id: "chat_ex_6",
                userQuery: "Obrigada, até sexta!",
                expectedResponse: "Nós que agradecemos 💕\nTe esperamos na sexta!\nTenha um ótimo dia 🌸"
            }
        ];

        // Append (avoid duplicates if possible, relatively safe here)
        config.trainingExamples.push(...newExamples);

        console.log(`Adding ${newExamples.length} new training examples...`);

        // Save back to DB
        await prisma.systemSetting.upsert({
            where: { key: 'zapai_ai_config' },
            update: { value: JSON.stringify(config) },
            create: { key: 'zapai_ai_config', value: JSON.stringify(config) }
        });

        console.log("✅ Training data imported successfully!");

    } catch (e) {
        console.error("Error importing:", e);
    } finally {
        await prisma.$disconnect();
    }
}

importTraining();

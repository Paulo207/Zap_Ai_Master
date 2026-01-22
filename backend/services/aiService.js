
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

// Configuration
const AVAILABLE_PROVIDERS = {
    OPENROUTER: {
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: process.env.OPENROUTER_API_KEY,
        model: "openai/gpt-3.5-turbo", // Verified working
        headers: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ZapAI"
        }
    },
    PERPLEXITY: {
        url: "https://api.perplexity.ai/chat/completions",
        key: process.env.PERPLEXITY_API_KEY,
        model: "sonar", // Verified working
        headers: {}
    }
};

// Select Active Provider (Prioritizing OpenRouter as it passed generic chat tests)
const ACTIVE_PROVIDER = AVAILABLE_PROVIDERS.OPENROUTER.key ? AVAILABLE_PROVIDERS.OPENROUTER : AVAILABLE_PROVIDERS.PERPLEXITY;

export const generateAIResponse = async (userMessage, history = []) => {
    if (!ACTIVE_PROVIDER.key) {
        return "⚠️ Erro: Nenhuma chave de API válida configurada (OpenRouter ou Perplexity).";
    }

    try {
        // System Prompt Setup
        // 1. Fetch System Config from DB
        let systemPrompt = `
            Você é o "ZapAI Master Advisor", um Vendedor Consultor de Elite.
            A ZapAI é uma loja de tecnologia premium. Vendemos smartphones, acessórios e serviços de automação.
            TOM: Persuasivo, Profissional e Amigável.
            DIRETRIZES: Sempre cumprimente pelo nome se souber. Nunca mencione que você é uma IA. Se o cliente parecer indeciso, ofereça o cupom "ZAP10".
            OBJETIVO: Vender, tirar dúvidas e ser extremamente prestativo.
        `;

        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'zapai_ai_config' }
            });
            await prisma.$disconnect();

            if (setting) {
                const config = JSON.parse(setting.value);
                if (config.systemPrompt) {
                    systemPrompt = config.systemPrompt;

                    // Inject Identity Context (Company + Profession)
                    let identityHeader = "";
                    if (config.companyName) {
                        identityHeader += `VOCÊ É E REPRESENTA: ${config.companyName}\n`;
                    }
                    if (config.profession) {
                        identityHeader += `SUA FUNÇÃO: ${config.profession.toUpperCase()}\n`;
                    }

                    if (identityHeader) {
                        systemPrompt = `${identityHeader}\nIMPORTANTE: Aja como tal. Nunca recomende procurar "um profissional", pois VOCÊ É O PROFISSIONAL.
                        \n${systemPrompt}`;
                    }

                    systemPrompt += `\n
                        REGRA DE AGENDAMENTO:
                        Sempre que você FINALIZAR e CONFIRMAR um agendamento (tiver Nome do Cliente, Serviço e Horário Definitivo), adicione ao FINAL da sua resposta este código oculto para eu registrar no sistema:
                        ||AGENDAMENTO: {"client": "Nome", "service": "Serviço", "date": "Data e Hora"}||
                        (Use exatamente formato JSON válido dentro de ||...||. O nome do cliente deve ser extraído da conversa ou do perfil do usuário.)`;

                    // Append Behavioral Directives from "Diretrizes Adicionais"
                    if (config.behavioralDirectives) {
                        systemPrompt += `\n\nDIRETRIZES DE COMPORTAMENTO:\n${config.behavioralDirectives}`;
                    }

                    // Inject Price Table
                    if (config.priceTable) {
                        systemPrompt += `\n\nTABELA DE PREÇOS:\n${config.priceTable}`;
                    }

                    // Inject Agenda
                    if (config.agenda) {
                        systemPrompt += `\n\nAGENDA / HORÁRIOS:\n${config.agenda}`;
                    }

                    // Append dynamic context if needed (knowledge base, etc.)
                    if (config.knowledgeBase && Array.isArray(config.knowledgeBase)) {
                        const kbText = config.knowledgeBase.map(k => `[${k.title}]: ${k.content}`).join('\n');
                        systemPrompt += `\n\nBASE DE CONHECIMENTO:\n${kbText}`;
                    }
                }
            }
        } catch (dbError) {
            console.warn("Failed to load AI config from DB, using default.", dbError);
        }

        // Prepare Training Examples (Few-Shot)
        const trainingMessages = [];
        try {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            const setting = await prisma.systemSetting.findUnique({ where: { key: 'zapai_ai_config' } });
            await prisma.$disconnect();
            if (setting) {
                const config = JSON.parse(setting.value);
                if (config.trainingExamples && Array.isArray(config.trainingExamples)) {
                    config.trainingExamples.forEach(ex => {
                        if (ex.userQuery && ex.expectedResponse) {
                            trainingMessages.push({ role: "user", content: ex.userQuery });
                            trainingMessages.push({ role: "assistant", content: ex.expectedResponse });
                        }
                    });
                }
            }
        } catch (e) { }

        // Format Messages (OpenAI Standard Format)
        // System -> Training Examples -> Chat History -> Current User Message
        const messages = [
            { role: "system", content: systemPrompt },
            ...trainingMessages,
            ...history.map(msg => ({
                role: msg.fromMe ? "assistant" : "user",
                content: msg.content
            })),
            { role: "user", content: userMessage }
        ];

        console.log(`🤖 Sending to AI (${ACTIVE_PROVIDER.model})...`);
        console.log(`📜 System Prompt: "${systemPrompt.slice(0, 100)}..."`); // Log start of prompt for verification

        const response = await fetch(ACTIVE_PROVIDER.url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ACTIVE_PROVIDER.key}`,
                "Content-Type": "application/json",
                ...ACTIVE_PROVIDER.headers
            },
            body: JSON.stringify({
                model: ACTIVE_PROVIDER.model,
                messages: messages,
                temperature: 0.8,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("AI API Error:", data);
            throw new Error(data.error?.message || response.statusText);
        }

        return data.choices[0]?.message?.content || "Desculpe, não entendi.";

    } catch (error) {
        console.error("❌ AI Generation Error:", error);
        return "Desculpe, estou processando muitas solicitações no momento. Tente novamente em breve.";
    }
};

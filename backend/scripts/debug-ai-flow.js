
import { PrismaClient } from '@prisma/client';
import { generateAIResponse } from './services/aiService.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const colors = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m" };

async function debugAiFlow() {
    console.log(`${colors.yellow}=== DEBUGGING AI FLOW ===${colors.reset}`);

    // 1. Simulating User Message
    const testPhone = '5511999999999';
    const testMessage = 'Opa, o agente assume?';

    console.log(`Simulating message from ${testPhone}: "${testMessage}"`);

    // 2. Check Conversation Status
    let conversation = await prisma.conversation.findUnique({ where: { phone: testPhone } });
    if (!conversation) {
        console.log("Creating test conversation...");
        conversation = await prisma.conversation.create({
            data: {
                phone: testPhone,
                name: 'Test User',
                status: 'active'
            }
        });
    } else {
        // Ensure active
        if (conversation.status !== 'active') {
            console.log(`Updating status from ${conversation.status} to active...`);
            conversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: 'active' }
            });
        }
    }
    console.log(`Conversation Status: ${colors.green}${conversation.status}${colors.reset}`);

    // 3. Generate AI Response
    console.log("\nGenerating AI Response...");
    try {
        const start = Date.now();
        const response = await generateAIResponse(testMessage, []);
        const duration = Date.now() - start;

        console.log(`\n${colors.green}AI Response:${colors.reset} ${response}`);
        console.log(`Duration: ${duration}ms`);

    } catch (e) {
        console.error(`${colors.red}AI Generation Failed:${colors.reset}`, e);
    }
}

debugAiFlow().finally(() => prisma.$disconnect());

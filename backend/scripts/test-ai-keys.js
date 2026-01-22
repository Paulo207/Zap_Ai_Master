
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const keys = {
    google: process.env.GOOGLE_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY
};

console.log(`${colors.blue}=== TESTING AI API KEYS ===${colors.reset}\n`);

// 1. Google Gemini
async function testGemini() {
    process.stdout.write("Testing Google Gemini... ");
    if (!keys.google) {
        console.log(`${colors.yellow}SKIPPED (No Key)${colors.reset}`);
        return;
    }
    try {
        const client = new GoogleGenAI({ apiKey: keys.google });
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ role: "user", parts: [{ text: "Hi" }] }]
        });
        if (response && response.text()) {
            console.log(`${colors.green}SUCCESS ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED (No response)${colors.reset}`);
        }
    } catch (e) {
        console.log(`${colors.red}FAILED ❌${colors.reset}`);
        console.log(`  Error: ${e.message}`);
    }
}

// 2. OpenAI
async function testOpenAI() {
    process.stdout.write("Testing OpenAI... ");
    if (!keys.openai) {
        console.log(`${colors.yellow}SKIPPED (No Key)${colors.reset}`);
        return;
    }
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${keys.openai}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 5
            })
        });
        const data = await response.json();
        if (response.ok && data.choices) {
            console.log(`${colors.green}SUCCESS ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED ❌${colors.reset}`);
            console.log(`  Error: ${data.error?.message || response.statusText}`);
        }
    } catch (e) {
        console.log(`${colors.red}FAILED ❌${colors.reset}`);
        console.log(`  Error: ${e.message}`);
    }
}

// 3. Anthropic (Claude)
async function testAnthropic() {
    process.stdout.write("Testing Anthropic (Claude)... ");
    if (!keys.anthropic) {
        console.log(`${colors.yellow}SKIPPED (No Key)${colors.reset}`);
        return;
    }
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": keys.anthropic,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 5,
                messages: [{ role: "user", content: "Hi" }]
            })
        });
        const data = await response.json();
        if (response.ok && data.content) {
            console.log(`${colors.green}SUCCESS ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED ❌${colors.reset}`);
            console.log(`  Error: ${data.error?.message || response.statusText}`);
        }
    } catch (e) {
        console.log(`${colors.red}FAILED ❌${colors.reset}`);
        console.log(`  Error: ${e.message}`);
    }
}

// 4. Perplexity
async function testPerplexity() {
    process.stdout.write("Testing Perplexity... ");
    if (!keys.perplexity) {
        console.log(`${colors.yellow}SKIPPED (No Key)${colors.reset}`);
        return;
    }
    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${keys.perplexity}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "sonar", // Try generic sonar
                messages: [{ role: "user", content: "Hi" }]
            })
        });
        const data = await response.json();
        if (response.ok && data.choices) {
            console.log(`${colors.green}SUCCESS ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED ❌${colors.reset}`);
            console.log(`  Error: ${data.error?.message || response.statusText}`);
        }
    } catch (e) {
        console.log(`${colors.red}FAILED ❌${colors.reset}`);
        console.log(`  Error: ${e.message}`);
    }
}

// 5. OpenRouter
async function testOpenRouter() {
    process.stdout.write("Testing OpenRouter... ");
    if (!keys.openrouter) {
        console.log(`${colors.yellow}SKIPPED (No Key)${colors.reset}`);
        return;
    }
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${keys.openrouter}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", // Test if key has credits
                messages: [{ role: "user", content: "Hi" }]
            })
        });
        const data = await response.json();
        if (response.ok && data.choices) {
            console.log(`${colors.green}SUCCESS ✅${colors.reset}`);
        } else {
            console.log(`${colors.red}FAILED ❌ - ${JSON.stringify(data.error) || response.statusText}${colors.reset}`);
        }
    } catch (e) {
        console.log(`${colors.red}FAILED ❌${colors.reset}`);
        console.log(`  Error: ${e.message}`);
    }
}

async function runTests() {
    await testGemini();
    await testOpenAI();
    await testAnthropic();
    await testPerplexity();
    await testOpenRouter();
    console.log(`\n${colors.blue}=== TESTS COMPLETED ===${colors.reset}`);
}

runTests();

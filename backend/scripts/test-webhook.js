
import fetch from 'node-fetch';

async function testWebhook() {
    console.log("Sending Test Webhook...");
    try {
        const res = await fetch('http://localhost:3001/api/webhook/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: {
                    id: "TEST_WEBHOOK_" + Date.now(),
                    from: "5511988887777@c.us",
                    body: "Opa, o agente assume?",
                    pushname: "Tester API",
                    fromMe: false
                },
                event_type: "message_received"
            })
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testWebhook();

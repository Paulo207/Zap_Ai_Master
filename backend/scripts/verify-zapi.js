
import fetch from 'node-fetch';

const INSTANCE = "3ED2F869E35852E227D572442EF70706";
const TOKEN = "593DEAA52DF523C089339D4A";
const CLIENT_TOKEN = "F0f70a10da4b747c2836a33992d5531a2S";

async function checkZApi() {
    console.log("🔍 Checking Z-API Connection...");
    console.log(`   Instance: ${INSTANCE}`);
    console.log(`   Token: ${TOKEN}`);

    try {
        const url = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/status`;
        const headers = {
            'Client-Token': CLIENT_TOKEN
        };

        const response = await fetch(url, { headers });
        const data = await response.json();

        console.log("\n📊 Response from Z-API:");
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log("\n✅ Credentials appear technically VALID (Server responded).");
            if (data.connected) {
                console.log("🚀 Instance is CONNECTED to WhatsApp.");
            } else {
                console.log("⚠️ Instance is DISCONNECTED. You need to scan the QR Code.");
            }
        } else {
            console.log("\n❌ Request Failed. Credentials might be INVALID.");
        }
    } catch (error) {
        console.error("\n❌ Error connecting to Z-API:", error.message);
    }
}

checkZApi();

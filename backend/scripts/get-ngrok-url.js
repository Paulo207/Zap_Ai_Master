
import fetch from 'node-fetch';

async function getUrl(port) {
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/tunnels`);
        const data = await res.json();
        if (data.tunnels && data.tunnels.length > 0) {
            console.log(`--- FOUND ON PORT ${port} ---`);
            const url = data.tunnels[0].public_url;
            console.log("NGROK URL:", url);
            console.log("WEBHOOK URL:", `${url}/api/webhook/message`);
            return true;
        }
    } catch (e) {
        // console.log(`Not found on ${port}`);
    }
    return false;
}

(async () => {
    if (await getUrl(4040)) return;
    if (await getUrl(4041)) return;
    if (await getUrl(4042)) return;
    console.log("Could not find active Ngrok tunnel.");
})();

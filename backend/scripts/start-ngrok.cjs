
const ngrok = require('ngrok');

(async function () {
    const token = '3825PBp7T9UtDFsaKNM9mrI7CgJ_6CwPk25nuqugETMLmut8h';
    console.log("Connecting to Ngrok...");
    try {
        const url = await ngrok.connect({
            proto: 'http',
            addr: 3001,
            authtoken: token,
            region: 'us' // Default
        });
        console.log('--- NGROK URL ---');
        console.log(url);
        console.log('-----------------');
        console.log(`Backend is accessible at: ${url}`);
        console.log(`Webhook URL: ${url}/api/webhook/message`);
    } catch (err) {
        console.error('Error starting ngrok:', err);
    }
})();

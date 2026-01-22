
import fetch from 'node-fetch';

async function debugUltraMsgQR() {
    const instanceId = 'instance142899';
    const token = 'yjj9hzzyiibozyva';
    const url = `https://api.ultramsg.com/${instanceId}/instance/qr?token=${token}`;

    console.log(`🔍 Chamando QR em: ${url}`);

    try {
        const response = await fetch(url);
        console.log('Status HTTP:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));

        const text = await response.text();
        console.log('Resposta Bruta (primeiros 100 caracteres):', text.substring(0, 100));

        try {
            const json = JSON.parse(text);
            console.log('JSON:', json);
        } catch (e) {
            console.log('Não é JSON');
        }
    } catch (e) {
        console.error('Erro:', e);
    }
}

debugUltraMsgQR();

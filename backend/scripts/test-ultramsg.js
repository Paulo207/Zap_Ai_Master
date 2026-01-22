
import fetch from 'node-fetch';

async function testUltraMsg() {
    const instanceId = 'instance142899';
    const token = 'yjj9hzzyiibozyva';
    const baseUrl = `https://api.ultramsg.com/${instanceId}`;

    console.log(`🔍 Testando UltraMsg: ${instanceId}`);

    try {
        const response = await fetch(`${baseUrl}/instance/status?token=${token}`);
        const data = await response.json();
        console.log('📊 Status UltraMsg:', JSON.stringify(data, null, 2));

        const qrRes = await fetch(`${baseUrl}/instance/qr?token=${token}`);
        if (qrRes.ok) {
            console.log('✅ QR Code disponível (OK)');
        } else {
            console.log('❌ Falha ao obter QR Code');
        }
    } catch (e) {
        console.error('❌ Erro no teste:', e);
    }
}

testUltraMsg();

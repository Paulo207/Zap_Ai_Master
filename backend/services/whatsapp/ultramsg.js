
import fetch from 'node-fetch';

export class UltraMsgProvider {
    constructor(config) {
        this.instanceId = config.instanceId;
        this.token = config.token;
        this.baseUrl = `https://api.ultramsg.com/${this.instanceId}`;
    }

    async sendMessage(phone, message) {
        const response = await fetch(`${this.baseUrl}/messages/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: this.token,
                to: phone,
                body: message
            })
        });

        if (!response.ok) {
            throw new Error(`UltraMsg Error: ${response.statusText}`);
        }
        return await response.json();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/instance/status?token=${this.token}`);
            const data = await response.json();

            // Handle different UltraMsg API versions/response structures
            let statusString = '';

            if (typeof data.status === 'string') {
                statusString = data.status;
            } else if (data.status && data.status.accountStatus && data.status.accountStatus.status) {
                statusString = data.status.accountStatus.status;
            }

            return {
                connected: statusString === 'authenticated' || statusString === 'connected',
                status: statusString,
                raw: data
            };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    async getQrCode() {
        try {
            console.log(`[UltraMsg] Fetching QR from ${this.baseUrl}/instance/qr?token=${this.token.substring(0, 5)}...`);
            const response = await fetch(`${this.baseUrl}/instance/qr?token=${this.token}`);

            const contentType = response.headers.get('content-type');

            // Check if it's an image
            if (contentType && contentType.includes('image')) {
                const buffer = await response.arrayBuffer();
                return Buffer.from(buffer);
            }

            // If not image, it's likely JSON error or notice
            const data = await response.json();

            if (data.error && data.error.includes('status is not equal "qr"')) {
                return { status: 'connected', message: 'Instance already connected' };
            }

            return data.url || data.qr || null;
        } catch (error) {
            console.error("[UltraMsg] QR Fetch Error:", error);
            return null;
        }
    }

    async getContacts() {
        try {
            const response = await fetch(`${this.baseUrl}/contacts?token=${this.token}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async restart() {
        await fetch(`${this.baseUrl}/instance/restart?token=${this.token}`, { method: 'POST' });
        return true;
    }

    async logout() {
        await fetch(`${this.baseUrl}/instance/logout?token=${this.token}`, { method: 'POST' });
        return true;
    }
}

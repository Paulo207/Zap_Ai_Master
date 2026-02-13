
import fetch from 'node-fetch';

export class ZAPIProvider {
    constructor(config) {
        this.instanceId = config.instanceId;
        this.token = config.token;
        this.clientToken = config.clientToken;
        this.baseUrl = `https://api.z-api.io/instances/${this.instanceId}/token/${this.token}`;
    }

    async sendMessage(phone, message) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.clientToken) headers['Client-Token'] = this.clientToken;

        const response = await fetch(`${this.baseUrl}/send-text`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone, message })
        });

        if (!response.ok) {
            throw new Error(`Z-API Error: ${response.statusText}`);
        }
        return await response.json();
    }

    async checkConnection() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;

        try {
            const response = await fetch(`${this.baseUrl}/status`, { headers });
            const data = await response.json();
            return {
                connected: data.connected,
                status: data.connected ? 'connected' : 'disconnected',
                raw: data
            };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    async getQrCode() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;

        try {
            // First check if already connected
            const status = await this.checkConnection();
            if (status.connected) {
                return { status: 'connected', message: 'Device already connected' };
            }

            // Try to get QR code image
            const response = await fetch(`${this.baseUrl}/qr-code/image`, { headers });

            if (!response.ok) {
                console.error(`Z-API QR Code Error: ${response.status} ${response.statusText}`);
                return null;
            }

            // Get the image as a buffer
            const buffer = await response.buffer();
            return buffer;
        } catch (error) {
            console.error('Error fetching QR code from Z-API:', error);
            return null;
        }
    }

    async getContacts() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;

        try {
            const response = await fetch(`${this.baseUrl}/contacts`, { headers });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Z-API Contacts Error:", error);
            return [];
        }
    }

    async restart() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        await fetch(`${this.baseUrl}/restart`, { headers });
        return true;
    }

    async logout() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        await fetch(`${this.baseUrl}/disconnect`, { headers });
        return true;
    }
    async updateWebhook(url) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.clientToken) headers['Client-Token'] = this.clientToken;

        console.log(`[Z-API] Updating webhook to: ${url}`);
        // Common Z-API Endpoint for Webhook
        try {
            const response = await fetch(`${this.baseUrl}/update-webhook-delivery`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    value: url,
                    enabled: true
                })
            });
            if (!response.ok) {
                const txt = await response.text();
                console.warn(`[Z-API] Webhook update failed: ${response.status} - ${txt}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error("[Z-API] Webhook update error:", error);
            return false;
        }
    }
}

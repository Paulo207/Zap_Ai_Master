
import fetch from 'node-fetch';

export class ZAPIProvider {
    constructor(config) {
        this.instanceId = config.instanceId;
        this.token = config.token;
        this.clientToken = config.clientToken;

        const host = config.apiHost || 'https://api.z-api.io';
        if (host.includes('z-api.io')) {
            this.baseUrl = `${host}/instances/${this.instanceId}/token/${this.token}`;
            this.isSelfHosted = false;
        } else {
            // Self-hosted (ConnectFlow) usually follows Z-API path structure
            const cleanHost = host.replace(/\/$/, '');
            const base = cleanHost.includes('/api') ? cleanHost : `${cleanHost}/api`;
            this.baseUrl = `${base}/instances/${this.instanceId}/token/${this.token}`;
            this.isSelfHosted = true;
        }
    }

    async sendMessage(phone, message) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        // In self-hosted, the Token might be needed in the headers
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        const endpoint = this.isSelfHosted ? '/messages/chat' : '/send-text';
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone, message })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Z-API Error (${response.status}): ${errBody || response.statusText}`);
        }
        return await response.json();
    }

    async checkConnection() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        try {
            const response = await fetch(`${this.baseUrl}/status`, { headers });
            const data = await response.json();
            return {
                connected: data.connected || data.status === 'connected',
                status: (data.connected || data.status === 'connected') ? 'connected' : 'disconnected',
                raw: data
            };
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    async getQrCode() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        try {
            const status = await this.checkConnection();
            if (status.connected) {
                return { status: 'connected', message: 'Device already connected' };
            }

            // For self-hosted, we try /qr-code first. For official, /qr-code/image
            const endpoint = this.isSelfHosted ? '/qr-code' : '/qr-code/image';
            const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });

            if (!response.ok) {
                console.error(`Z-API QR Code Error: ${response.status} ${response.statusText}`);
                return null;
            }

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const data = await response.json();
                // ConnectFlow and similar clones often return { value: "base64..." } or { base64: "..." }
                const b64 = data.value || data.base64 || data.qr;
                if (b64 && typeof b64 === 'string') {
                    return b64.startsWith('data:image') ? b64 : `data:image/png;base64,${b64}`;
                }
                console.error('[Z-API] JSON response without QR data:', data);
                return null;
            }

            // node-fetch 3.x doesn't have .buffer(), use arrayBuffer()
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('Error fetching QR code from Z-API:', error);
            return null;
        }
    }

    async getContacts() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

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
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        await fetch(`${this.baseUrl}/restart`, { method: 'POST', headers });
        return true;
    }

    async logout() {
        const headers = {};
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        const endpoint = this.isSelfHosted ? '/logout' : '/disconnect';
        await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', headers });
        return true;
    }

    async updateWebhook(url) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.clientToken) headers['Client-Token'] = this.clientToken;
        if (this.isSelfHosted) headers['Access-Token'] = this.token;

        console.log(`[Z-API] Updating webhook to: ${url}`);
        try {
            const endpoint = this.isSelfHosted ? '/update-webhook' : '/update-webhook-delivery';
            const method = this.isSelfHosted ? 'POST' : 'PUT';

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
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

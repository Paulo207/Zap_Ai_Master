import { WhatsAppConfig } from '../types';

const API_URL = 'http://localhost:3001/api';

// 1. Check Status
export const checkDeviceStatus = async (config: WhatsAppConfig) => {
  try {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();

    if (data.connected === true || data.status === 'connected' || data.status === 'authenticated') {
      return {
        status: "connected",
        rawStatus: data.status || "Conectado",
        number: "",
        device: data.device || (config.provider === 'ultramsg' ? 'UltraMsg' : 'Z-API')
      };
    } else {
      return {
        status: "disconnected",
        rawStatus: data.error || data.message || "Desconectado",
        number: "",
        device: ""
      };
    }
  } catch (error) {
    console.error("Error checking device status:", error);
    return { status: "disconnected", number: "", device: "" };
  }
};

// 2. Get QR Code
export const getQRCode = async (config: WhatsAppConfig): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/qr`);

    if (!response.ok) {
      console.error("Failed to get QR code");
      return "";
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.status === 'connected') {
        return "CONNECTED"; // Sentinel value
      }
      return "";
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error getting QR code:", error);
    return "";
  }
};

// 3. Send Message
export const sendMessageViaWhatsApp = async (config: WhatsAppConfig, to: string, body: string) => {
  try {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: to,
        message: body
      })
    });

    const data = await response.json();
    return response.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

// 4. Restart / Logout
export const restartInstance = async (config: WhatsAppConfig) => {
  try {
    await fetch(`${API_URL}/restart`);
    return true;
  } catch (e) { return false; }
};

export const logoutDevice = async (config: WhatsAppConfig) => {
  try {
    await fetch(`${API_URL}/logout`);
    return true;
  } catch (e) { return false; }
};

// 5. Get Messages (Polling Workaround - now getting from DB via backend)
export const getMessages = async (config: WhatsAppConfig, limit: number = 20, status: 'unread' | 'all' = 'unread') => {
  // This is now primarily handled by the App component fetching from /api/conversations
  // But we can keep it for compatibility if needed, or return empty.
  // Ideally, the App calling logic should change.
  return [];
};

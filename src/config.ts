// Centralized API URL configuration
// Using separate export constants for clarity

// In development, normally it's localhost:3001
// In production (Vercel), we should use the VITE_API_URL or a relative path if proxied
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Priority:
// 1. Environment variable VITE_API_URL
// 2. Relative /api if on production but hostname is not localhost (requires vercel.json rewrites)
// 3. Fallback to localhost:3001/api if on localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (isLocalhost ? 'http://localhost:3001/api' : '/api');

export const API_URL = API_BASE_URL;

console.log('Using API_URL:', API_URL);

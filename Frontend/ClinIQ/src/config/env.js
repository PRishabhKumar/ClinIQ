export const isProd = import.meta.env.MODE === 'production';

// In production, this will point to your Render backend URL.
// Ensure you have configured this correctly in Vercel environment variables or manually replace the URL.
export const API_BASE_URL = isProd 
  ? (import.meta.env.VITE_API_URL || 'https://cliniq-backend.onrender.com/api/v1')
  : 'http://localhost:5000/api/v1';

export const AUTH_BASE_URL = isProd
  ? (import.meta.env.VITE_AUTH_URL || 'https://cliniq-backend.onrender.com')
  : 'http://localhost:5000';

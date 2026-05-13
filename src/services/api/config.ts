export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://122.166.169.82:7091/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'accept': '*/*' ,
    'Accept': 'application/json',
  },
};
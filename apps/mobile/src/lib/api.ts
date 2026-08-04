import axios from 'axios';
import { storage, TOKEN_KEY } from './storage';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  return 'http://localhost:3000';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Asynchronously attach JWT token from SecureStore/Storage
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[ApiClient] Failed to retrieve JWT token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor for handling global API responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

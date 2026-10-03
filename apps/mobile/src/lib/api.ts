import { Platform } from 'react-native';
import axios from 'axios';
import { storage, TOKEN_KEY } from './storage';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
};

/** The API origin. The realtime socket must use the same one, or it connects somewhere else. */
export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

let onUnauthorized: (() => void) | null = null;

/** Registers what to do when the server says the session is no longer valid (the app signs out). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// Response Interceptor: an expired or revoked token anywhere signs the user out, instead of every
// screen quietly showing empty data. Wrong passwords on the sign-in forms are not session expiry.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error?.config?.url ?? '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error?.response?.status === 401 && !isAuthForm) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Turns a stored media path ("/uploads/x.jpg") into a URL this device can load. Full URLs and data URIs pass through. */
export function mediaUrl(path: string): string {
  if (!path || /^(https?:|data:|file:|content:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

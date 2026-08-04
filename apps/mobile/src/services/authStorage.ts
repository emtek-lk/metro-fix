import { User } from '@metro-fix/core-types';

const TOKEN_KEY = 'metrofix_mobile_jwt';
const USER_KEY = 'metrofix_mobile_user';

// In-memory cache for ultra-fast sync reads
let cachedToken: string | null = null;
let cachedUser: User | null = null;

function getLocalStorage(): any {
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

export const authStorage = {
  async setToken(token: string): Promise<void> {
    cachedToken = token;
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(TOKEN_KEY, token);
      }
    } catch {
      // Memory fallback active
    }
  },

  async getToken(): Promise<string | null> {
    if (cachedToken) return cachedToken;
    try {
      const storage = getLocalStorage();
      if (storage) {
        cachedToken = storage.getItem(TOKEN_KEY);
      }
    } catch {
      // Memory fallback active
    }
    return cachedToken;
  },

  async setUser(user: User): Promise<void> {
    cachedUser = user;
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch {
      // Memory fallback active
    }
  },

  async getUser(): Promise<User | null> {
    if (cachedUser) return cachedUser;
    try {
      const storage = getLocalStorage();
      if (storage) {
        const data = storage.getItem(USER_KEY);
        if (data) {
          cachedUser = JSON.parse(data);
        }
      }
    } catch {
      // Memory fallback active
    }
    return cachedUser;
  },

  async clear(): Promise<void> {
    cachedToken = null;
    cachedUser = null;
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(USER_KEY);
      }
    } catch {
      // Memory fallback active
    }
  },
};

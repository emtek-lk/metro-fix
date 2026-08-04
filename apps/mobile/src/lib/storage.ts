import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'metrofix_jwt';
export const USER_KEY = 'metrofix_user';

function getWebStorage(): any {
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

export const storage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        const webStore = getWebStorage();
        if (webStore) {
          return webStore.getItem(key);
        }
      } catch (err) {
        console.warn('[Storage] localStorage getItem failed:', err);
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('[Storage] SecureStore getItemAsync failed:', err);
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const webStore = getWebStorage();
        if (webStore) {
          webStore.setItem(key, value);
        }
      } catch (err) {
        console.warn('[Storage] localStorage setItem failed:', err);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[Storage] SecureStore setItemAsync failed:', err);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const webStore = getWebStorage();
        if (webStore) {
          webStore.removeItem(key);
        }
      } catch (err) {
        console.warn('[Storage] localStorage deleteItem failed:', err);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[Storage] SecureStore deleteItemAsync failed:', err);
    }
  },
};

import { storage, TOKEN_KEY } from '../lib/storage';

export const authStorage = {
  getToken: async () => await storage.getItemAsync(TOKEN_KEY),
  setToken: async (token: string) => await storage.setItemAsync(TOKEN_KEY, token),
  removeToken: async () => await storage.deleteItemAsync(TOKEN_KEY),
};

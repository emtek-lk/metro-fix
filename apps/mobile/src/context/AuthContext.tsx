import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@metro-fix/core-types';
import { storage, TOKEN_KEY, USER_KEY } from '../lib/storage';
import { apiClient } from '../lib/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  setAuthSession: (user: User, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authentication session on boot
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await storage.getItemAsync(TOKEN_KEY);
        const storedUserJson = await storage.getItemAsync(USER_KEY);

        if (storedToken && storedUserJson) {
          const parsedUser: User = JSON.parse(storedUserJson);
          setToken(storedToken);
          setUser(parsedUser);

          // Verify token validity by calling profile endpoint
          try {
            const res = await apiClient.get('/auth/me');
            if (res.data) {
              setUser(res.data);
              await storage.setItemAsync(USER_KEY, JSON.stringify(res.data));
            }
          } catch {
            // Profile check failed; continue with stored user if valid
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Failed to restore session on boot:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const setAuthSession = async (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    await storage.setItemAsync(TOKEN_KEY, newToken);
    await storage.setItemAsync(USER_KEY, JSON.stringify(newUser));
  };

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await apiClient.post('/auth/login', { email, password: pass });
    const { accessToken, user: authenticatedUser } = res.data;
    await setAuthSession(authenticatedUser, accessToken);
    return authenticatedUser;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.deleteItemAsync(TOKEN_KEY);
    await storage.deleteItemAsync(USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        setAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

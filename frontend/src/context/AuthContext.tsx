import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/models';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { setOnUnauthorizedCallback } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string) => Promise<string>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const storedToken = await StorageService.getAuthToken();
      if (!storedToken) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        return false;
      }

      const isValid = await AuthService.validateToken(storedToken);
      if (isValid) {
        const storedUser = await StorageService.getAuthUser();
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        return false;
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intercept 401 from API client
    setOnUnauthorizedCallback(() => {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    });

    checkSession();

    return () => {
      setOnUnauthorizedCallback(null);
    };
  }, [checkSession]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(email, pass);
      setUser(result.user);
      setToken(result.token);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, pass: string) => {
    const message = (await AuthService.register(username, email, pass)).message;
    return message;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

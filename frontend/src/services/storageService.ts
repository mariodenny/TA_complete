import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'smartpot_auth_token',
  AUTH_USER: 'smartpot_auth_user',
  API_URL: 'smartpot_api_url',
  USE_MOCK: 'smartpot_use_mock',
  DEVICES_CACHE: 'smartpot_devices_cache',
  SENSORS_CACHE: 'smartpot_sensors_cache',
  PLANTS_CACHE: 'smartpot_plants_cache',
  THRESHOLDS_CACHE: 'smartpot_thresholds_cache',
};

// Default API URL based on runtime environment
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5700',
  default: 'http://localhost:5700',
});

export const StorageService = {
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string | null): Promise<void> {
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (e) {
      console.warn('StorageService setAuthToken error', e);
    }
  },

  async getAuthUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setAuthUser(user: any | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {
      console.warn('StorageService setAuthUser error', e);
    }
  },

  async getApiUrl(): Promise<string> {
    try {
      const url = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
      return url || DEFAULT_API_URL;
    } catch {
      return DEFAULT_API_URL;
    }
  },

  async setApiUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url);
    } catch (e) {
      console.warn('StorageService setApiUrl error', e);
    }
  },

  async getUseMock(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.USE_MOCK);
      // Default to false so real backend is tested by default
      return value === 'true';
    } catch {
      return false;
    }
  },

  async setUseMock(useMock: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USE_MOCK, String(useMock));
    } catch (e) {
      console.warn('StorageService setUseMock error', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`StorageService setItem error for ${key}`, e);
    }
  },

  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.AUTH_USER,
      ]);
    } catch (e) {
      console.warn('StorageService clearSession error', e);
    }
  },
};

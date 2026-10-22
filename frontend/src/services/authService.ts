import { ApiClient } from './apiClient';
import { StorageService } from './storageService';
import { UserProfile } from '../types/models';

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthService = {
  /**
   * Validates whether a token exists, is structurally valid, has not expired,
   * and optionally confirms with the backend /api/devices/test endpoint.
   */
  async validateToken(token: string | null): Promise<boolean> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return false;
    }

    const isMock = await StorageService.getUseMock();
    if (isMock) {
      return token.startsWith('mock-');
    }

    // Check expiration timestamp from JWT payload
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) {
      // Malformed token
      await StorageService.clearSession();
      return false;
    }

    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTimeSeconds) {
      // Token is expired!
      console.log('[Auth] Token expired at', new Date(payload.exp * 1000).toISOString());
      await StorageService.clearSession();
      return false;
    }

    // Verify against protected endpoint if online
    try {
      await ApiClient.get('/api/devices/test');
      return true;
    } catch (err: any) {
      if (err.statusCode === 401) {
        await StorageService.clearSession();
        return false;
      }
      // If network error (offline), allow offline session if token is within expiry window
      return true;
    }
  },

  async login(
    email: string,
    pass: string
  ): Promise<{ user: UserProfile; token: string }> {
    const isMock = await StorageService.getUseMock();

    if (isMock) {
      const mockUser: UserProfile = {
        id: 1,
        username: email.split('@')[0] || 'SmartPot User',
        email,
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      await StorageService.setAuthToken(mockToken);
      await StorageService.setAuthUser(mockUser);
      return { user: mockUser, token: mockToken };
    }

    const res = await ApiClient.post('/api/auth/login', {
      email: email.trim(),
      password: pass,
    });

    const { access_token, user_id } = res.data;

    let user: UserProfile = {
      id: user_id,
      username: email.split('@')[0],
      email: email.trim(),
    };

    await StorageService.setAuthToken(access_token);

    // Fetch user profile from /api/auth/<user_id>/user
    try {
      const profileRes = await ApiClient.get(`/api/auth/${user_id}/user`);
      if (profileRes.data?.user) {
        user = {
          id: profileRes.data.user.id || user_id,
          username: profileRes.data.user.username || user.username,
          email: profileRes.data.user.email || user.email,
        };
      }
    } catch {
      // Fallback to basic user if profile endpoint fails
    }

    await StorageService.setAuthUser(user);
    return { user, token: access_token };
  },

  async register(
    username: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; message: string }> {
    const isMock = await StorageService.getUseMock();

    if (isMock) {
      return { success: true, message: 'Registrasi berhasil (Mode Mock).' };
    }

    const res = await ApiClient.post('/api/auth/register', {
      username: username.trim(),
      email: email.trim(),
      password: pass,
    });

    return {
      success: true,
      message: res.message || 'Registrasi berhasil. Silakan masuk dengan akun Anda.',
    };
  },

  async logout(): Promise<void> {
    await StorageService.clearSession();
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    return await StorageService.getAuthUser();
  },
};

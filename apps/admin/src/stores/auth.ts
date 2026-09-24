// Auth Pinia store — login, logout, session restore
import { defineStore } from 'pinia';
import { apiPost, apiGet, setAccessToken, getAccessToken } from '../api/client';

interface AuthUser {
  id: number;
  email: string;
}

interface LoginResponse {
  ok: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

interface RefreshResponse {
  ok: boolean;
  data: {
    accessToken: string;
  };
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    initialized: false,
    loggingIn: false,
    error: null as string | null,
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null,
  },

  actions: {
    async login(email: string, password: string): Promise<boolean> {
      this.loggingIn = true;
      this.error = null;
      try {
        const res = await apiPost<LoginResponse>('/auth/login', { email, password });
        setAccessToken(res.data.accessToken);
        this.user = res.data.user;
        return true;
      } catch (err: unknown) {
        const message = (err as { data?: { message?: string } })?.data?.message;
        this.error = message ?? 'লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করুন।';
        return false;
      } finally {
        this.loggingIn = false;
      }
    },

    async logout() {
      try {
        await apiPost('/auth/logout');
      } catch {
        // best-effort
      }
      setAccessToken(null);
      this.user = null;
    },

    async tryRestoreSession() {
      this.initialized = true;
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          const meRes = await apiGet<{ ok: boolean; data: AuthUser }>('/auth/me');
          this.user = meRes.data;
          return;
        } catch {
          // Token may be expired, attempt refresh below
        }
      }

      try {
        // Try to refresh — the httpOnly refresh cookie will be sent automatically
        const res = await apiPost<RefreshResponse>('/auth/refresh');
        setAccessToken(res.data.accessToken);
        // Get user profile
        const meRes = await apiGet<{ ok: boolean; data: AuthUser }>('/auth/me');
        this.user = meRes.data;
      } catch {
        // No active session — stay logged out
        setAccessToken(null);
        this.user = null;
      }
    },

    async refreshToken(): Promise<string | null> {
      try {
        const res = await apiPost<RefreshResponse>('/auth/refresh');
        setAccessToken(res.data.accessToken);
        return res.data.accessToken;
      } catch {
        setAccessToken(null);
        this.user = null;
        return null;
      }
    },
  },
});

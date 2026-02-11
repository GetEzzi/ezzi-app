import axios from 'axios';
import { API_BASE_URL } from '../config';
import { API_ENDPOINTS, AuthenticatedUser, AuthResponse } from '@shared/api.ts';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`,
      { email, password },
      { timeout: 15000 },
    );

    return response.data;
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`,
      {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      },
      { timeout: 15000 },
    );

    return {
      data: response.data.data,
      error: response.data.error,
    };
  },

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const token = await this.getAuthToken();
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get<AuthenticatedUser>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.USER}`,
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string): Promise<void> {
    try {
      const result = await window.electronAPI.authSetToken(token);
      if (!result.success) {
        console.error('Failed to set auth token:', result.error);
      }
    } catch (error: unknown) {
      console.error('Error setting auth token:', error);
    }
  },

  async clearAuthToken(): Promise<void> {
    try {
      const result = await window.electronAPI.authClearToken();
      if (!result.success) {
        console.error('Failed to clear auth token:', result.error);
      }
    } catch (error: unknown) {
      console.error('Error clearing auth token:', error);
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      const result = await window.electronAPI.authGetToken();
      if (result.success) {
        return result.token || null;
      } else {
        console.error('Failed to get auth token:', result.error);

        return null;
      }
    } catch (error: unknown) {
      console.error('Error getting auth token:', error);

      return null;
    }
  },

  async signOut(): Promise<void> {
    await this.clearAuthToken();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },
};

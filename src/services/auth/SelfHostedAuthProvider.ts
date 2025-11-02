import { IAuthProvider } from './AuthProvider';
import {
  AuthenticatedUser,
  AuthResponse,
  SubscriptionLevel,
} from '@shared/api.ts';
import { getStorageProvider } from '../storage';

export class SelfHostedAuthProvider implements IAuthProvider {
  private async createMockUser(): Promise<AuthenticatedUser> {
    const settings = await getStorageProvider().getSettings();

    return {
      user: {
        email: 'self-hosted@local',
      },
      subscription: {
        active_from: new Date(
          new Date().setMonth(new Date().getMonth() - 1),
        ).toISOString(),
        active_to: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        ).toISOString(),
        level: SubscriptionLevel.PRO,
      },
      settings: {
        solutionLanguage: settings.solutionLanguage,
        userLanguage: settings.userLanguage,
      },
    };
  }

  login(_email: string, _password: string): Promise<AuthResponse> {
    return Promise.resolve({
      data: {
        user: {
          email: 'self-hosted@local',
        },
        session: {
          access_token: 'self-hosted-token',
        },
      },
      error: null,
    });
  }

  signUp(email: string, password: string): Promise<AuthResponse> {
    return this.login(email, password);
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    return await this.createMockUser();
  }

  setAuthToken(_token: string): Promise<void> {
    return Promise.resolve();
  }

  clearAuthToken(): Promise<void> {
    return Promise.resolve();
  }

  getAuthToken(): Promise<string | null> {
    return Promise.resolve('self-hosted-token');
  }

  signOut(): Promise<void> {
    return Promise.resolve();
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

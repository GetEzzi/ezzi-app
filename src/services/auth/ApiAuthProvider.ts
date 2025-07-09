import { IAuthProvider } from './AuthProvider';
import { AuthenticatedUser, AuthResponse } from '@shared/api.ts';
import { authService } from '../auth';

export class ApiAuthProvider implements IAuthProvider {
  async login(email: string, password: string): Promise<AuthResponse> {
    return authService.login(email, password);
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    return authService.signUp(email, password);
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    return authService.getCurrentUser();
  }

  async setAuthToken(token: string): Promise<void> {
    return authService.setAuthToken(token);
  }

  async clearAuthToken(): Promise<void> {
    return authService.clearAuthToken();
  }

  async getAuthToken(): Promise<string | null> {
    return authService.getAuthToken();
  }

  async signOut(): Promise<void> {
    return authService.signOut();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();

    return token !== null;
  }
}

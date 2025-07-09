import { AuthenticatedUser, AuthResponse } from '@shared/api.ts';

export interface IAuthProvider {
  login(email: string, password: string): Promise<AuthResponse>;
  signUp(email: string, password: string): Promise<AuthResponse>;
  getCurrentUser(): Promise<AuthenticatedUser | null>;
  setAuthToken(token: string): Promise<void>;
  clearAuthToken(): Promise<void>;
  getAuthToken(): Promise<string | null>;
  signOut(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

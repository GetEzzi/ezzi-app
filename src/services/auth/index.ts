import { isSelfHosted } from '@shared/constants.ts';
import { ApiAuthProvider } from './ApiAuthProvider';
import type { IAuthProvider } from './AuthProvider';
import { SelfHostedAuthProvider } from './SelfHostedAuthProvider';

export * from './AuthProvider';

let authProvider: IAuthProvider | null = null;

export const getAuthProvider = (): IAuthProvider => {
  if (!authProvider) {
    authProvider = isSelfHosted() ? new SelfHostedAuthProvider() : new ApiAuthProvider();
  }

  return authProvider;
};

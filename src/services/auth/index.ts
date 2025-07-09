import { IAuthProvider } from './AuthProvider';
import { ApiAuthProvider } from './ApiAuthProvider';
import { SelfHostedAuthProvider } from './SelfHostedAuthProvider';
import { isSelfHosted } from '@shared/constants.ts';

export * from './AuthProvider';

let authProvider: IAuthProvider | null = null;

export const getAuthProvider = (): IAuthProvider => {
  if (!authProvider) {
    authProvider = isSelfHosted()
      ? new SelfHostedAuthProvider()
      : new ApiAuthProvider();
  }

  return authProvider;
};

import { createContext, useContext } from 'react';
import { AuthenticatedUser } from '@shared/api.ts';

interface SubscriptionContextValue {
  user: AuthenticatedUser;
  isFree: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export const SubscriptionProvider = SubscriptionContext.Provider;

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }

  return context;
}

export function useIsFreeUser(): boolean {
  const { isFree } = useSubscription();

  return isFree;
}

import { IStorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { ApiStorageProvider } from './ApiStorageProvider';
import { isSelfHosted } from '@shared/constants.ts';
import { SubscriptionLevel } from '@shared/api.ts';

export * from './StorageProvider';

let storageProvider: IStorageProvider | null = null;
let currentSubscriptionLevel: SubscriptionLevel | null = null;

export const getStorageProvider = (
  subscriptionLevel?: SubscriptionLevel,
): IStorageProvider => {
  const level = subscriptionLevel ?? currentSubscriptionLevel;
  const useLocal =
    isSelfHosted() || level === SubscriptionLevel.FREE;

  // If subscription level changed, reset provider
  if (level && level !== currentSubscriptionLevel) {
    currentSubscriptionLevel = level;
    storageProvider = null;
  }

  if (!storageProvider) {
    storageProvider = useLocal
      ? new LocalStorageProvider()
      : new ApiStorageProvider();
  }

  return storageProvider;
};

export const resetStorageProvider = (): void => {
  storageProvider = null;
  currentSubscriptionLevel = null;
};

import { IStorageProvider } from './StorageProvider';
import { LocalStorageProvider } from './LocalStorageProvider';
import { ApiStorageProvider } from './ApiStorageProvider';
import { isSelfHosted } from '@shared/constants.ts';

export * from './StorageProvider';

let storageProvider: IStorageProvider | null = null;

export const getStorageProvider = (): IStorageProvider => {
  if (!storageProvider) {
    storageProvider = isSelfHosted()
      ? new LocalStorageProvider()
      : new ApiStorageProvider();
  }

  return storageProvider;
};

import { AppMode, ProgrammingLanguage, UserLanguage } from './api';

/**
 * Centralized storage keys and configuration for both Electron and React
 */

// Electron Store Names
export const ELECTRON_STORES = {
  AUTH: 'auth',
  APP_SETTINGS: 'app-settings',
} as const;

// Electron Storage Keys
export const ELECTRON_STORAGE_KEYS = {
  AUTH: {
    TOKEN: 'authToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    LAST_USED_EMAIL: 'lastUsedEmail',
  },
  APP_SETTINGS: {
    APP_MODE: 'appMode',
    READABLE_VAR_NAMES: 'readableVarNames',
  },
} as const;

// React localStorage Keys
export const LOCAL_STORAGE_KEYS = {
  EZZI_SETTINGS: 'ezzi-settings',
} as const;

// Storage Schema Types
export interface AuthStoreSchema {
  authToken: string | null;
  tokenExpiry: number | null;
  lastUsedEmail: string | null;
}

export interface AppStoreSchema {
  appMode: AppMode | null;
  readableVarNames: boolean | null;
}

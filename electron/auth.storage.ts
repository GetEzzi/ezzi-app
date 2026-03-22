import Store from 'electron-store';
import {
  ELECTRON_STORES,
  ELECTRON_STORAGE_KEYS,
  AuthStoreSchema,
} from '../shared/storage';
import { SubscriptionLevel } from '../shared/api';

export interface IAuthStore {
  set(
    key: keyof AuthStoreSchema,
    value: AuthStoreSchema[keyof AuthStoreSchema],
  ): void;
  get(key: keyof AuthStoreSchema): AuthStoreSchema[keyof AuthStoreSchema];
  delete(key: keyof AuthStoreSchema): void;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const store = new Store<AuthStoreSchema>({
  name: ELECTRON_STORES.AUTH,
  schema: {
    [ELECTRON_STORAGE_KEYS.AUTH.TOKEN]: {
      type: ['string', 'null'] as any,
      default: null,
    },
    [ELECTRON_STORAGE_KEYS.AUTH.TOKEN_EXPIRY]: {
      type: ['number', 'null'] as any,
      default: null,
    },
    [ELECTRON_STORAGE_KEYS.AUTH.LAST_USED_EMAIL]: {
      type: ['string', 'null'] as any,
      default: null,
    },
    [ELECTRON_STORAGE_KEYS.AUTH.SUBSCRIPTION_LEVEL]: {
      type: ['string', 'null'] as any,
      default: null,
    },
  },
}) as unknown as IAuthStore;
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export class AuthStorage {
  private static instance: AuthStorage;
  private readonly store: IAuthStore;

  private constructor() {
    this.store = store;
  }

  static getInstance(): AuthStorage {
    if (!AuthStorage.instance) {
      AuthStorage.instance = new AuthStorage();
    }

    return AuthStorage.instance;
  }

  setAuthToken(token: string, expiryTimestamp?: number): void {
    this.store.set(ELECTRON_STORAGE_KEYS.AUTH.TOKEN, token);
    if (expiryTimestamp) {
      this.store.set(ELECTRON_STORAGE_KEYS.AUTH.TOKEN_EXPIRY, expiryTimestamp);
    }
  }

  getAuthToken(): string | null {
    const token = this.store.get(ELECTRON_STORAGE_KEYS.AUTH.TOKEN) as
      | string
      | null;
    const expiry = this.store.get(ELECTRON_STORAGE_KEYS.AUTH.TOKEN_EXPIRY) as
      | number
      | null;

    // Check if token has expired
    if (expiry && Date.now() > expiry) {
      this.clearAuthToken();

      return null;
    }

    return token;
  }

  clearAuthToken(): void {
    this.store.delete(ELECTRON_STORAGE_KEYS.AUTH.TOKEN);
    this.store.delete(ELECTRON_STORAGE_KEYS.AUTH.TOKEN_EXPIRY);
    this.store.delete(ELECTRON_STORAGE_KEYS.AUTH.SUBSCRIPTION_LEVEL);
  }

  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  setLastUsedEmail(email: string): void {
    this.store.set(ELECTRON_STORAGE_KEYS.AUTH.LAST_USED_EMAIL, email);
  }

  getLastUsedEmail(): string | null {
    return this.store.get(ELECTRON_STORAGE_KEYS.AUTH.LAST_USED_EMAIL) as
      | string
      | null;
  }

  setSubscriptionLevel(level: SubscriptionLevel): void {
    this.store.set(ELECTRON_STORAGE_KEYS.AUTH.SUBSCRIPTION_LEVEL, level);
  }

  getSubscriptionLevel(): SubscriptionLevel | null {
    return this.store.get(
      ELECTRON_STORAGE_KEYS.AUTH.SUBSCRIPTION_LEVEL,
    ) as SubscriptionLevel | null;
  }
}

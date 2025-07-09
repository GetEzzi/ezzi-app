import Store from 'electron-store';

interface AuthStoreSchema {
  authToken: string | null;
  tokenExpiry: number | null;
}

export interface IAuthStore {
  set(
    key: keyof AuthStoreSchema,
    value: AuthStoreSchema[keyof AuthStoreSchema],
  ): void;
  get(key: keyof AuthStoreSchema): AuthStoreSchema[keyof AuthStoreSchema];
  delete(key: keyof AuthStoreSchema): void;
}

const store = new Store<AuthStoreSchema>({
  name: 'auth',
  schema: {
    authToken: {
      type: 'string',
      nullable: true,
      default: null,
    },
    tokenExpiry: {
      type: 'number',
      nullable: true,
      default: null,
    },
  },
}) as unknown as IAuthStore;

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
    this.store.set('authToken', token);
    if (expiryTimestamp) {
      this.store.set('tokenExpiry', expiryTimestamp);
    }
  }

  getAuthToken(): string | null {
    const token = this.store.get('authToken') as string | null;
    const expiry = this.store.get('tokenExpiry') as number | null;

    // Check if token has expired
    if (expiry && Date.now() > expiry) {
      this.clearAuthToken();

      return null;
    }

    return token;
  }

  clearAuthToken(): void {
    this.store.delete('authToken');
    this.store.delete('tokenExpiry');
  }

  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }
}

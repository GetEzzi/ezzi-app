import Store from 'electron-store';
import { AppMode } from '../shared/api';
import {
  ELECTRON_STORES,
  ELECTRON_STORAGE_KEYS,
  AppStoreSchema,
} from '../shared/storage';

export interface IAppStore {
  set(
    key: keyof AppStoreSchema,
    value: AppStoreSchema[keyof AppStoreSchema],
  ): void;
  get(key: keyof AppStoreSchema): AppStoreSchema[keyof AppStoreSchema];
  delete(key: keyof AppStoreSchema): void;
}

const store = new Store<AppStoreSchema>({
  name: ELECTRON_STORES.APP_SETTINGS,
  schema: {
    [ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE]: {
      type: ['string', 'null'],
      default: AppMode.LIVE_INTERVIEW,
    },
  },
}) as unknown as IAppStore;

export class AppStorage {
  private static instance: AppStorage;
  private readonly store: IAppStore;

  private constructor() {
    this.store = store;
  }

  static getInstance(): AppStorage {
    if (!AppStorage.instance) {
      AppStorage.instance = new AppStorage();
    }

    return AppStorage.instance;
  }

  setAppMode(appMode: AppMode): void {
    this.store.set(ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE, appMode);
  }

  getAppMode(): AppMode {
    const storedMode = this.store.get(
      ELECTRON_STORAGE_KEYS.APP_SETTINGS.APP_MODE,
    );

    return storedMode || AppMode.LIVE_INTERVIEW;
  }
}

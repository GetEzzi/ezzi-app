import { ElectronAPI, IElectron } from './electron';

declare global {
  interface Window {
    __IS_INITIALIZED__: boolean;
    __LANGUAGE__: string;
    __LOCALE__: string;
    __AUTH_TOKEN__: string | null;
    electronAPI: ElectronAPI;
    electron: IElectron;
  }
}

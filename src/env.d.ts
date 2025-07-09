/// <reference types="vite/client" />

import { ProgrammingLanguage, UserLanguage } from '../shared/api';

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ElectronAPI {
  openSubscriptionPortal: (authData: {
    email: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateContentDimensions: (dimensions: {
    width: number;
    height: number;
  }) => Promise<void>;
  clearStore: () => Promise<{ success: boolean; error?: string }>;
  getScreenshots: () => Promise<{
    success: boolean;
    previews?: Array<{ path: string; preview: string }> | null;
    error?: string;
  }>;
  deleteScreenshot: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onScreenshotTaken: (
    callback: (data: { path: string; preview: string }) => void,
  ) => () => void;
  onResetView: (callback: () => void) => () => void;
  onSolutionStart: (callback: () => void) => () => void;
  onDebugStart: (callback: () => void) => () => void;
  onDebugSuccess: (callback: (data: any) => void) => () => void;
  onSolutionError: (callback: (error: string) => void) => () => void;
  onProcessingNoScreenshots: (callback: () => void) => () => void;
  onSolutionSuccess: (callback: (data: any) => void) => () => void;
  onUnauthorized: (callback: () => void) => () => void;
  onDebugError: (callback: (error: string) => void) => () => void;
  openExternal: (url: string) => void;
  toggleMainWindow: () => Promise<{ success: boolean; error?: string }>;
  triggerScreenshot: () => Promise<{ success: boolean; error?: string }>;
  triggerReset: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveLeft: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveRight: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveUp: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveDown: () => Promise<{ success: boolean; error?: string }>;
  onSubscriptionUpdated: (callback: () => void) => () => void;
  onSubscriptionPortalClosed: (callback: () => void) => () => void;
  handleMouseEnter: (...args: any[]) => void;
  handleMouseLeave: (...args: any[]) => void;
  handleCloseClick: (...args: any[]) => void;
  handleQueueLoadedNoScreenshots: () => void;
  handleQueueLoadedWithScreenshots: (screenshotCount: number) => void;
  // Auth token operations
  authSetToken: (
    token: string,
    expiryTimestamp?: number,
  ) => Promise<{ success: boolean; error?: string }>;
  authGetToken: () => Promise<{
    success: boolean;
    token?: string | null;
    error?: string;
  }>;
  authClearToken: () => Promise<{ success: boolean; error?: string }>;
  authIsAuthenticated: () => Promise<{
    success: boolean;
    isAuthenticated?: boolean;
    error?: string;
  }>;
}

interface Window {
  electronAPI: ElectronAPI;
  electron: {
    ipcRenderer: {
      on(channel: string, func: (...args: any[]) => void): void;
      removeListener(channel: string, func: (...args: any[]) => void): void;
    };
  };
  __LANGUAGE__: ProgrammingLanguage;
  __LOCALE__: UserLanguage;
  __IS_INITIALIZED__: boolean;
  __AUTH_TOKEN__: string | null;
}

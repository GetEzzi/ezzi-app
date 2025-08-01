import { QueryObserverResult, Register } from '@tanstack/react-query';
import { AppMode } from '../shared/api';

export interface ElectronAPI {
  openSubscriptionPortal: (authData: {
    email: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateContentDimensions: (dimensions: {
    width: number;
    height: number;
    source: string;
  }) => Promise<void>;
  clearStore: () => Promise<{ success: boolean; error?: string }>;
  getScreenshots: () => Promise<
    {
      path: string;
      preview: string;
    }[]
  >;
  deleteScreenshot: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onScreenshotTaken: (
    callback: () => Promise<
      QueryObserverResult<
        [TQueryFnData][TQueryFnData extends any ? 0 : never],
        Register extends {
          defaultError: infer TError;
        }
          ? TError
          : Error
      >
    >,
  ) => () => Promise<void>;
  onResetView: (
    callback: () => Promise<
      QueryObserverResult<
        [TQueryFnData][TQueryFnData extends any ? 0 : never],
        Register extends { defaultError: infer TError } ? TError : Error
      >
    >,
  ) => () => Promise<void>;
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
  openSettingsPortal: () => Promise<void>;
  getPlatform: () => string;
  handleMouseEnter: (...args: any[]) => Promise<any>;
  handleMouseLeave: (...args: any[]) => Promise<any>;
  handleCloseClick: (...args: any[]) => Promise<any>;
  handleQueueLoadedNoScreenshots: () => void;
  handleQueueLoadedWithScreenshots: (screenshotCount: number) => void;
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
  setAppMode: (
    appMode: AppMode,
  ) => Promise<{ success: boolean; error?: string }>;
}

export interface IElectron {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => void;
    removeListener: (channel: string, func: (...args: any[]) => void) => void;
  };
}

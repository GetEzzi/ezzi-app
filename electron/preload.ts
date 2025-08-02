import { contextBridge, ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../shared/constants';
import { AppMode } from '../shared/api';
import { shell } from 'electron';

// Types for the exposed Electron API
interface ElectronAPI {
  openSubscriptionPortal: (authData: {
    email: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateContentDimensions: (dimensions: {
    width: number;
    height: number;
    source: string;
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
  openExternal: (url: string) => Promise<void>;
  toggleMainWindow: () => Promise<{ success: boolean; error?: string }>;
  triggerScreenshot: () => Promise<{ success: boolean; error?: string }>;
  triggerReset: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveLeft: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveRight: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveUp: () => Promise<{ success: boolean; error?: string }>;
  triggerMoveDown: () => Promise<{ success: boolean; error?: string }>;
  onSubscriptionUpdated: (callback: () => void) => () => void;
  onSubscriptionPortalClosed: (callback: () => void) => () => void;
  getPlatform: () => string;
  handleMouseEnter: (...args: any[]) => Promise<any>;
  handleMouseLeave: (...args: any[]) => Promise<any>;
  handleCloseClick: (...args: any[]) => Promise<any>;
  handleQueueLoadedNoScreenshots: () => Promise<any>;
  handleQueueLoadedWithScreenshots: (screenshotCount: number) => Promise<any>;
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
  setAppMode: (
    appMode: AppMode,
  ) => Promise<{ success: boolean; error?: string }>;
  writeText: (text: string) => Promise<{ success: boolean; error?: string }>;
  setWindowFocusable: (
    focusable: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
}

export const PROCESSING_EVENTS = {
  //global states
  UNAUTHORIZED: 'procesing-unauthorized',
  NO_SCREENSHOTS: 'processing-no-screenshots',

  //states for generating the initial solution
  INITIAL_START: 'initial-start',
  SOLUTION_SUCCESS: 'solution-success',
  INITIAL_SOLUTION_ERROR: 'solution-error',

  //states for processing the debugging
  DEBUG_START: 'debug-start',
  DEBUG_SUCCESS: 'debug-success',
  DEBUG_ERROR: 'debug-error',
} as const;

// At the top of the file
console.log('Preload script is running');

const electronAPI = {
  openSubscriptionPortal: async (authData: {
    email: string;
  }): Promise<unknown> => {
    return ipcRenderer.invoke('open-subscription-portal', authData);
  },
  openSettingsPortal: () => ipcRenderer.invoke('open-settings-portal'),
  updateContentDimensions: (dimensions: {
    width: number;
    height: number;
    source: string;
  }) => ipcRenderer.invoke('update-content-dimensions', dimensions),
  clearStore: () => ipcRenderer.invoke('clear-store'),
  getScreenshots: () => ipcRenderer.invoke('get-screenshots'),
  deleteScreenshot: (path: string) =>
    ipcRenderer.invoke('delete-screenshot', path),
  toggleMainWindow: async () => {
    console.log('toggleMainWindow called from preload');
    try {
      const result = (await ipcRenderer.invoke('toggle-window')) as unknown;
      console.log('toggle-window result:', result);

      return result;
    } catch (error) {
      console.error('Error in toggleMainWindow:', error);

      throw error;
    }
  },
  // Event listeners
  onScreenshotTaken: (
    callback: (data: { path: string; preview: string }) => void,
  ) => {
    const subscription = (_: any, data: { path: string; preview: string }) =>
      callback(data);
    ipcRenderer.on('screenshot-taken', subscription);

    return () => {
      ipcRenderer.removeListener('screenshot-taken', subscription);
    };
  },
  onResetView: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('reset-view', subscription);

    return () => {
      ipcRenderer.removeListener('reset-view', subscription);
    };
  },
  onSolutionStart: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_START, subscription);

    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.INITIAL_START, subscription);
    };
  },
  onDebugStart: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_START, subscription);

    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_START, subscription);
    };
  },
  onDebugSuccess: (callback: (data: any) => void) => {
    ipcRenderer.on('debug-success', (_event, data) => callback(data));

    return () => {
      ipcRenderer.removeListener('debug-success', (_event, data) =>
        callback(data),
      );
    };
  },
  onDebugError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error);
    ipcRenderer.on(PROCESSING_EVENTS.DEBUG_ERROR, subscription);

    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.DEBUG_ERROR, subscription);
    };
  },
  onSolutionError: (callback: (error: string) => void) => {
    const subscription = (_: any, error: string) => callback(error);
    ipcRenderer.on(PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, subscription);

    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
        subscription,
      );
    };
  },
  onProcessingNoScreenshots: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on(PROCESSING_EVENTS.NO_SCREENSHOTS, subscription);

    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.NO_SCREENSHOTS,
        subscription,
      );
    };
  },
  onSolutionSuccess: (callback: (data: any) => void) => {
    const subscription = (_: any, data: any) => callback(data);
    ipcRenderer.on(PROCESSING_EVENTS.SOLUTION_SUCCESS, subscription);

    return () => {
      ipcRenderer.removeListener(
        PROCESSING_EVENTS.SOLUTION_SUCCESS,
        subscription,
      );
    };
  },
  onUnauthorized: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on(PROCESSING_EVENTS.UNAUTHORIZED, subscription);

    return () => {
      ipcRenderer.removeListener(PROCESSING_EVENTS.UNAUTHORIZED, subscription);
    };
  },
  openExternal: (url: string) => shell.openExternal(url),
  triggerScreenshot: () => ipcRenderer.invoke('trigger-screenshot'),
  triggerReset: () => ipcRenderer.invoke('trigger-reset'),
  triggerMoveLeft: () => ipcRenderer.invoke('trigger-move-left'),
  triggerMoveRight: () => ipcRenderer.invoke('trigger-move-right'),
  triggerMoveUp: () => ipcRenderer.invoke('trigger-move-up'),
  triggerMoveDown: () => ipcRenderer.invoke('trigger-move-down'),
  onSubscriptionUpdated: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('subscription-updated', subscription);

    return () => {
      ipcRenderer.removeListener('subscription-updated', subscription);
    };
  },
  onSubscriptionPortalClosed: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('subscription-portal-closed', subscription);

    return () => {
      ipcRenderer.removeListener('subscription-portal-closed', subscription);
    };
  },
  getPlatform: () => process.platform,
  handleMouseEnter: () => ipcRenderer.invoke(IPC_EVENTS.TOOLTIP.MOUSE_ENTER),
  handleMouseLeave: () => ipcRenderer.invoke(IPC_EVENTS.TOOLTIP.MOUSE_LEAVE),
  handleCloseClick: () => ipcRenderer.invoke(IPC_EVENTS.TOOLTIP.CLOSE_CLICK),
  handleQueueLoadedNoScreenshots: () =>
    ipcRenderer.invoke(IPC_EVENTS.QUEUE.LOADED_NO_SCREENSHOTS),
  handleQueueLoadedWithScreenshots: (screenshotCount) =>
    ipcRenderer.invoke(
      IPC_EVENTS.QUEUE.LOADED_WITH_SCREENSHOTS,
      screenshotCount,
    ),
  // Auth token operations
  authSetToken: (token: string, expiryTimestamp?: number) =>
    ipcRenderer.invoke('auth-set-token', token, expiryTimestamp),
  authGetToken: () => ipcRenderer.invoke('auth-get-token'),
  authClearToken: () => ipcRenderer.invoke('auth-clear-token'),
  authIsAuthenticated: () => ipcRenderer.invoke('auth-is-authenticated'),
  setAppMode: (appMode: AppMode) =>
    ipcRenderer.invoke(IPC_EVENTS.APP_MODE.CHANGE, appMode),
  writeText: (text: string) => ipcRenderer.invoke('write-text', text),
  setWindowFocusable: (focusable: boolean) =>
    ipcRenderer.invoke('set-window-focusable', focusable),
} as ElectronAPI;

// Before exposing the API
console.log(
  'About to expose electronAPI with methods:',
  Object.keys(electronAPI),
);

// Expose the API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('electronAPI exposed to window');

// Add this focus restoration handler
ipcRenderer.on('restore-focus', () => {
  // Try to focus the active element if it exists
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && typeof activeElement.focus === 'function') {
    activeElement.focus();
  }
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => {
      if (channel === 'auth-callback') {
        ipcRenderer.on(channel, (event, ...args) =>
          func(...(args as unknown[])),
        );
      }
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      if (channel === 'auth-callback') {
        ipcRenderer.removeListener(channel, (event, ...args) =>
          func(...(args as unknown[])),
        );
      }
    },
  },
});

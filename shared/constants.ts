/**
 * Check if running in self-hosted mode
 * In React: Uses import.meta.env.VITE_SELF_HOSTED_MODE
 * In Electron: Uses process.env.VITE_SELF_HOSTED_MODE
 */
export const isSelfHosted = (): boolean => {
  // For React app
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_SELF_HOSTED_MODE === 'true';
  }

  // For Electron app
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_SELF_HOSTED_MODE === 'true';
  }

  // Default to false (API mode)
  return false;
};

/**
 * API base URL for both React and Electron apps
 * In React: Uses import.meta.env.VITE_API_BASE_URL
 * In Electron: Uses process.env.VITE_API_BASE_URL
 * Falls back to development URL if not set
 */
export const getApiBaseUrl = (): string => {
  // For React app
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // For Electron app
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // Fallback (should not happen)
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

export const IPC_EVENTS = {
  TOOLTIP: {
    MOUSE_ENTER: 'tooltip:mouse-enter',
    MOUSE_LEAVE: 'tooltip:mouse-leave',
    CLOSE_CLICK: 'tooltip:close-click',
  },
  QUEUE: {
    LOADED_NO_SCREENSHOTS: 'queue:loaded-no-screenshots',
    LOADED_WITH_SCREENSHOTS: 'queue:loaded-with-screenshots',
  },
} as const;

// Type for all IPC events
export type IpcEvents = typeof IPC_EVENTS;
export type IpcEventKeys = keyof IpcEvents;

// Helper type to get all possible event names
export type AllIpcEvents = {
  [K in keyof IpcEvents]: IpcEvents[K] extends { [key: string]: string }
    ? IpcEvents[K][keyof IpcEvents[K]]
    : IpcEvents[K];
}[keyof IpcEvents];

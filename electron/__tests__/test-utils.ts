import { BrowserWindow } from 'electron';

export function createMockBrowserWindow(
  overrides: Partial<BrowserWindow> = {},
): BrowserWindow {
  return {
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    setIgnoreMouseEvents: jest.fn(),
    setFocusable: jest.fn(),
    setSkipTaskbar: jest.fn(),
    setAlwaysOnTop: jest.fn(),
    setBounds: jest.fn(),
    getBounds: jest.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
    close: jest.fn(),
    destroy: jest.fn(),
    setSize: jest.fn(),
    getSize: jest.fn(() => [800, 600]),
    setPosition: jest.fn(),
    getPosition: jest.fn(() => [0, 0]),
    center: jest.fn(),
    isVisible: jest.fn(() => true),
    ...overrides,
  } as BrowserWindow;
}

export function createMockScreenshotHelper() {
  return {
    takeScreenshot: jest.fn(),
    getScreenshotQueue: jest.fn(() => []),
    clearScreenshotQueue: jest.fn(),
    addToScreenshotQueue: jest.fn(),
  };
}

export function createMockProcessingHelper() {
  return {
    processScreenshots: jest.fn(),
    startProcessing: jest.fn(),
    stopProcessing: jest.fn(),
    isProcessing: jest.fn(() => false),
  };
}

export function createMockAuthStorage() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
  };
}

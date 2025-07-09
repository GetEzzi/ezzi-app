const { app } = require('electron');

jest.mock('electron', () => ({
  app: {
    quit: jest.fn(),
    isPackaged: false,
    getPath: jest.fn(() => '/tmp/test-path'),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    setAsDefaultProtocolClient: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    loadURL: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
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
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    })),
    getAllDisplays: jest.fn(() => []),
  },
  shell: {
    openExternal: jest.fn(),
  },
  globalShortcut: {
    register: jest.fn(),
    unregister: jest.fn(),
    unregisterAll: jest.fn(),
  },
}));

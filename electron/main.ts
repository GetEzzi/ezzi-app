import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { initializeIpcHandlers } from './ipc.handlers';
import { ProcessingHelper } from './processing.helper';
import { ScreenshotHelper } from './screenshot.helper';
import { ShortcutsHelper } from './shortcuts';
import * as dotenv from 'dotenv';

const isDev = !app.isPackaged;

const state = {
  mainWindow: null as BrowserWindow | null,
  isWindowVisible: false,
  windowPosition: null as { x: number; y: number } | null,
  windowSize: null as { width: number; height: number } | null,
  screenWidth: 0,
  screenHeight: 0,
  step: 0,
  currentX: 0,
  currentY: 0,

  screenshotHelper: null as ScreenshotHelper | null,
  shortcutsHelper: null as ShortcutsHelper | null,
  processingHelper: null as ProcessingHelper | null,

  view: 'queue' as 'queue' | 'solutions' | 'debug',
  hasDebugged: false,

  PROCESSING_EVENTS: {
    UNAUTHORIZED: 'processing-unauthorized',
    NO_SCREENSHOTS: 'processing-no-screenshots',
    API_KEY_INVALID: 'processing-api-key-invalid',
    INITIAL_START: 'initial-start',
    SOLUTION_SUCCESS: 'solution-success',
    INITIAL_SOLUTION_ERROR: 'solution-error',
    DEBUG_START: 'debug-start',
    DEBUG_SUCCESS: 'debug-success',
    DEBUG_ERROR: 'debug-error',
  } as const,
};

export interface IProcessingHelperDeps {
  getScreenshotHelper: () => ScreenshotHelper | null;
  getMainWindow: () => BrowserWindow | null;
  getView: () => 'queue' | 'solutions' | 'debug';
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  getScreenshotQueue: () => string[];
  getExtraScreenshotQueue: () => string[];
  clearQueues: () => void;
  takeScreenshot: () => Promise<string>;
  getImagePreview: (filepath: string) => Promise<string>;
  deleteScreenshot: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  setHasDebugged: (value: boolean) => void;
  getHasDebugged: () => boolean;
  PROCESSING_EVENTS: typeof state.PROCESSING_EVENTS;
}

export interface IShortcutsHelperDeps {
  getMainWindow: () => BrowserWindow | null;
  takeScreenshot: () => Promise<string>;
  getImagePreview: (filepath: string) => Promise<string>;
  processingHelper: ProcessingHelper | null;
  clearQueues: () => void;
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  isVisible: () => boolean;
  toggleMainWindow: () => void;
  moveWindowLeft: () => void;
  moveWindowRight: () => void;
  moveWindowUp: () => void;
  moveWindowDown: () => void;
}

export interface IIpcHandlerDeps {
  getMainWindow: () => BrowserWindow | null;
  setWindowDimensions: (width: number, height: number) => void;
  getScreenshotQueue: () => string[];
  getExtraScreenshotQueue: () => string[];
  deleteScreenshot: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getImagePreview: (filepath: string) => Promise<string>;
  processingHelper: ProcessingHelper | null;
  PROCESSING_EVENTS: typeof state.PROCESSING_EVENTS;
  takeScreenshot: () => Promise<string>;
  getView: () => 'queue' | 'solutions' | 'debug';
  toggleMainWindow: () => void;
  clearQueues: () => void;
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  moveWindowLeft: () => void;
  moveWindowRight: () => void;
  moveWindowUp: () => void;
  moveWindowDown: () => void;
}

function initializeHelpers() {
  state.screenshotHelper = new ScreenshotHelper(state.view);
  state.processingHelper = new ProcessingHelper({
    getScreenshotHelper,
    getMainWindow,
    getView,
    setView,
    getScreenshotQueue,
    getExtraScreenshotQueue,
    clearQueues,
    takeScreenshot,
    getImagePreview,
    deleteScreenshot,
    setHasDebugged,
    getHasDebugged,
    PROCESSING_EVENTS: state.PROCESSING_EVENTS,
  } as IProcessingHelperDeps);
  state.shortcutsHelper = new ShortcutsHelper({
    getMainWindow,
    takeScreenshot,
    getImagePreview,
    processingHelper: state.processingHelper,
    clearQueues,
    setView,
    isVisible: () => state.isWindowVisible,
    toggleMainWindow,
    moveWindowLeft: () =>
      moveWindowHorizontal((x) =>
        Math.max(-(state.windowSize?.width || 0) / 2, x - state.step),
      ),
    moveWindowRight: () =>
      moveWindowHorizontal((x) =>
        Math.min(
          state.screenWidth - (state.windowSize?.width || 0) / 2,
          x + state.step,
        ),
      ),
    moveWindowUp: () => moveWindowVertical((y) => y - state.step),
    moveWindowDown: () => moveWindowVertical((y) => y + state.step),
  } as IShortcutsHelperDeps);
}

if (process.platform === 'darwin') {
  app.setAsDefaultProtocolClient('ezzi');
} else {
  app.setAsDefaultProtocolClient('ezzi', process.execPath, [
    path.resolve(process.argv[1] || ''),
  ]);
}

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient('ezzi', process.execPath, [
    path.resolve(process.argv[1]),
  ]);
}

// Force Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (state.mainWindow) {
      if (state.mainWindow.isMinimized()) {
        state.mainWindow.restore();
      }
      state.mainWindow.focus();
    }
  });
}

async function createWindow(): Promise<void> {
  if (state.mainWindow) {
    if (state.mainWindow.isMinimized()) {
      state.mainWindow.restore();
    }
    state.mainWindow.focus();

    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize;
  state.screenWidth = workArea.width;
  state.screenHeight = workArea.height;
  state.step = 60;
  state.currentY = 50;

  // Base window settings that are common for both modes
  const baseWindowSettings: Electron.BrowserWindowConstructorOptions = {
    width: 500,
    height: 520,
    x: state.currentX,
    y: 50,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev
        ? path.join(__dirname, '../dist-electron/preload.js')
        : path.join(__dirname, 'preload.js'),
      scrollBounce: true,
    },
    show: true,
    fullscreenable: false,
    // Important: MUST BE default "true" for Login/Signup to have active inputs
    focusable: true,
    enableLargerThanScreen: true,
    // Invisible options but we still want them always ON
    frame: false,
    hasShadow: false,
    transparent: true,
    skipTaskbar: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#00000000',
    type: 'panel',
    paintWhenInitiallyHidden: true,
    movable: true,
  };

  state.mainWindow = new BrowserWindow(baseWindowSettings);

  // Add more detailed logging for window events
  state.mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  state.mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
      if (isDev) {
        // In development, retry loading after a short delay
        console.log('Retrying to load development server...');
        setTimeout(() => {
          state.mainWindow?.loadURL('http://localhost:54321').catch((error) => {
            console.error('Failed to load dev server on retry:', error);
          });
        }, 1000);
      }
    },
  );

  if (isDev) {
    setTimeout(() => {
      state.mainWindow.loadURL('http://localhost:54321').catch((error) => {
        console.error('Failed to load dev server:', error);
      });
    }, 200);
  } else {
    console.log(
      'Loading production build:',
      path.join(__dirname, '../dist/index.html'),
    );
    await state.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Configure window behavior
  state.mainWindow.webContents.setZoomFactor(1);
  if (isDev) {
    // console.log('Dev mode enabled, opening dev tools...');
    // state.mainWindow.webContents.openDevTools();
  }
  state.mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'allow' };
  });

  state.mainWindow.setContentProtection(true);
  state.mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  state.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  // Warning: calling those options on other OS breaks app loading
  // Additional screen capture resistance settings for macOS
  if (process.platform === 'darwin') {
    state.mainWindow.setHiddenInMissionControl(true);
    state.mainWindow.setWindowButtonVisibility(false);
    state.mainWindow.setBackgroundColor('#00000000');
    state.mainWindow.setHasShadow(false);
  }

  // Prevent a window from being included in the window switcher
  state.mainWindow.setSkipTaskbar(true);

  // Prevent the window from being captured by screen recording
  state.mainWindow.webContents.setBackgroundThrottling(false);
  state.mainWindow.webContents.setFrameRate(60);

  // Set up window listeners
  state.mainWindow.on('move', handleWindowMove);
  state.mainWindow.on('resize', handleWindowResize);
  state.mainWindow.on('closed', handleWindowClosed);

  // Initialize window state
  const bounds = state.mainWindow.getBounds();
  state.windowPosition = { x: bounds.x, y: bounds.y };
  state.windowSize = { width: bounds.width, height: bounds.height };
  state.currentX = bounds.x;
  state.currentY = bounds.y;
  state.isWindowVisible = true;
}

function handleWindowMove(): void {
  if (!state.mainWindow) {
    return;
  }
  const bounds = state.mainWindow.getBounds();
  state.windowPosition = { x: bounds.x, y: bounds.y };
  state.currentX = bounds.x;
  state.currentY = bounds.y;
}

function handleWindowResize(): void {
  if (!state.mainWindow) {
    return;
  }
  const bounds = state.mainWindow.getBounds();
  state.windowSize = { width: bounds.width, height: bounds.height };
}

function handleWindowClosed(): void {
  state.mainWindow = null;
  state.isWindowVisible = false;
  state.windowPosition = null;
  state.windowSize = null;
}

function hideMainWindow(): void {
  if (!state.mainWindow?.isDestroyed()) {
    console.log('Hiding main window...');

    const bounds = state.mainWindow.getBounds();
    state.windowPosition = { x: bounds.x, y: bounds.y };
    state.windowSize = { width: bounds.width, height: bounds.height };

    state.mainWindow.setIgnoreMouseEvents(true, { forward: true });
    state.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    state.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    state.mainWindow.setOpacity(0);
    state.mainWindow.hide();

    state.isWindowVisible = false;

    // Unregister all shortcuts except CommandOrControl+B when window is hidden
    state.shortcutsHelper?.registerVisibilityShortcutOnly();
  }
}

function showMainWindow(): void {
  if (!state.mainWindow?.isDestroyed()) {
    console.log('Showing main window...');

    if (state.windowPosition && state.windowSize) {
      state.mainWindow.setBounds({
        ...state.windowPosition,
        ...state.windowSize,
      });
    }

    // Allow click-thru only if Queue mode and no screenshots
    const view = getView();
    const screenshots = getScreenshotQueue();
    if (view === 'queue' && screenshots.length === 0) {
      console.log('showMainWindow: in Queue mode and no screenshots ');
      state.mainWindow.setIgnoreMouseEvents(false);
      state.mainWindow.setFocusable(true);
    }

    state.mainWindow.setSkipTaskbar(true);

    state.mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    state.mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    state.mainWindow.setContentProtection(true);

    state.mainWindow.setOpacity(0);
    state.mainWindow.showInactive();
    state.mainWindow.setOpacity(1);

    state.isWindowVisible = true;

    // Register all shortcuts when window is visible
    state.shortcutsHelper?.registerAllShortcuts();
  }
}

// Debounce to prevent multiple toggles
let isToggling = false;
function toggleMainWindow(): void {
  if (isToggling) {
    return;
  }

  isToggling = true;

  if (state.isWindowVisible) {
    hideMainWindow();
  } else {
    showMainWindow();
  }

  setTimeout(() => {
    isToggling = false;
  }, 300);
}

function moveWindowHorizontal(updateFn: (x: number) => number): void {
  if (!state.mainWindow) {
    return;
  }
  state.currentX = updateFn(state.currentX);
  state.mainWindow.setPosition(
    Math.round(state.currentX),
    Math.round(state.currentY),
  );
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow) {
    return;
  }

  const newY = updateFn(state.currentY);
  // Allow window to go 2/3 off screen in either direction
  const maxUpLimit = (-(state.windowSize?.height || 0) * 2) / 3;
  const maxDownLimit =
    state.screenHeight + ((state.windowSize?.height || 0) * 2) / 3;

  // Only update if within bounds
  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY;
    state.mainWindow.setPosition(
      Math.round(state.currentX),
      Math.round(state.currentY),
    );
  }
}

function setWindowDimensions(width: number, height: number): void {
  if (!state.mainWindow?.isDestroyed()) {
    // console.log(`setWindowDimensions width:${width} height:${height}`);
    const [currentX, currentY] = state.mainWindow.getPosition();
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workAreaSize;
    const maxWidth = Math.floor(workArea.width * 0.5);

    state.mainWindow.setBounds({
      x: Math.min(currentX, workArea.width - maxWidth),
      y: currentY,
      width: Math.min(width + 32, maxWidth),
      height: Math.ceil(height),
    });
  }
}

function loadEnvVariables(): void {
  try {
    const envPath = path.join(process.cwd(), '.env');

    console.log('Loading env variables from:', envPath);

    const result = dotenv.config({ path: envPath });

    if (result.error) {
      console.error(
        'Error loading environment variables:',
        result.error.message,
      );
    } else {
      console.debug('Environment variables loaded successfully');
    }
  } catch (error) {
    console.error('Failed to load environment variables:', error);
  }
}

async function initializeApp() {
  try {
    loadEnvVariables();
    initializeHelpers();
    initializeIpcHandlers({
      getMainWindow,
      setWindowDimensions,
      getScreenshotQueue,
      getExtraScreenshotQueue,
      deleteScreenshot,
      getImagePreview,
      processingHelper: state.processingHelper,
      PROCESSING_EVENTS: state.PROCESSING_EVENTS,
      takeScreenshot,
      getView,
      toggleMainWindow,
      clearQueues,
      setView,
      moveWindowLeft: () =>
        moveWindowHorizontal((x) =>
          Math.max(-(state.windowSize?.width || 0) / 2, x - state.step),
        ),
      moveWindowRight: () =>
        moveWindowHorizontal((x) =>
          Math.min(
            state.screenWidth - (state.windowSize?.width || 0) / 2,
            x + state.step,
          ),
        ),
      moveWindowUp: () => moveWindowVertical((y) => y - state.step),
      moveWindowDown: () => moveWindowVertical((y) => y + state.step),
    });
    await createWindow();

    state.shortcutsHelper?.registerGlobalShortcuts();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// Prevent multiple instances of the app
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.error('Failed to lock application instance');
  app.quit();
} else {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
      state.mainWindow = null;
    }
  });
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().then().catch(console.error);
  }
  if (BrowserWindow.getAllWindows().length > 0) {
    console.error('Multiple windows detected');
  }
});

function getMainWindow(): BrowserWindow | null {
  return state.mainWindow;
}

function getView(): 'queue' | 'solutions' | 'debug' {
  return state.view;
}

function setView(view: 'queue' | 'solutions' | 'debug'): void {
  state.view = view;
  state.screenshotHelper?.setView(view);
}

function getScreenshotHelper(): ScreenshotHelper | null {
  return state.screenshotHelper;
}

function getScreenshotQueue(): string[] {
  return state.screenshotHelper?.getScreenshotQueue() || [];
}

function getExtraScreenshotQueue(): string[] {
  return state.screenshotHelper?.getExtraScreenshotQueue() || [];
}

function clearQueues(): void {
  state.screenshotHelper?.clearQueues();
  setView('queue');
}

async function takeScreenshot(): Promise<string> {
  if (!state.mainWindow) {
    throw new Error('No main window available');
  }

  return (
    (await state.screenshotHelper?.takeScreenshot(
      () => hideMainWindow(),
      () => showMainWindow(),
    )) || ''
  );
}

async function getImagePreview(filepath: string): Promise<string> {
  return (await state.screenshotHelper?.getImagePreview(filepath)) || '';
}

async function deleteScreenshot(
  path: string,
): Promise<{ success: boolean; error?: string }> {
  return (
    (await state.screenshotHelper?.deleteScreenshot(path)) || {
      success: false,
      error: 'Screenshot helper not initialized',
    }
  );
}

function setHasDebugged(value: boolean): void {
  state.hasDebugged = value;
}

function getHasDebugged(): boolean {
  return state.hasDebugged;
}

export {
  state,
  createWindow,
  hideMainWindow,
  showMainWindow,
  toggleMainWindow,
  setWindowDimensions,
  moveWindowHorizontal,
  moveWindowVertical,
  getMainWindow,
  getView,
  setView,
  getScreenshotHelper,
  getScreenshotQueue,
  getExtraScreenshotQueue,
  clearQueues,
  takeScreenshot,
  getImagePreview,
  deleteScreenshot,
  setHasDebugged,
  getHasDebugged,
};

app.whenReady().then(initializeApp).catch(console.error);

import { app, BrowserWindow, screen, clipboard } from 'electron';
import path from 'path';
import { initializeIpcHandlers } from './ipc.handlers';
import { ProcessingHelper } from './processing.helper';
import { ScreenshotHelper } from './screenshot.helper';
import { ShortcutsHelper } from './shortcuts';
import { AppMode } from '../shared/api';
import { WindowConfigFactory } from './window-config/WindowConfigFactory';
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
  appMode: AppMode.LIVE_INTERVIEW as AppMode,

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
  getAppMode: () => AppMode;
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
  setWindowDimensions: (width: number, height: number, source: string) => void;
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
  getAppMode: () => AppMode;
  setAppMode: (appMode: AppMode) => void;
  toggleMainWindow: () => void;
  clearQueues: () => void;
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  moveWindowLeft: () => void;
  moveWindowRight: () => void;
  moveWindowUp: () => void;
  moveWindowDown: () => void;
  applyQueueWindowBehavior: () => void;
  writeText: (text: string) => Promise<{ success: boolean; error?: string }>;
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
    getAppMode,
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
  state.currentY = 50;

  const configFactory = WindowConfigFactory.getInstance();
  const windowConfig = configFactory.getConfig(state.appMode);

  state.step = 60;

  const baseWindowSettings: Electron.BrowserWindowConstructorOptions = {
    ...windowConfig.baseSettings,
    x: state.currentX,
    y: 50,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev
        ? path.join(__dirname, '../dist-electron/preload.js')
        : path.join(__dirname, 'preload.js'),
      scrollBounce: true,
    },
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

  // Apply platform-specific configurations
  const platformConfig = windowConfig.behavior.platformSpecific;
  if (process.platform === 'darwin' && platformConfig.darwin) {
    state.mainWindow.setHiddenInMissionControl(
      platformConfig.darwin.hiddenInMissionControl,
    );
    state.mainWindow.setWindowButtonVisibility(
      platformConfig.darwin.windowButtonVisibility,
    );
    state.mainWindow.setBackgroundColor(platformConfig.darwin.backgroundColor);
    state.mainWindow.setHasShadow(platformConfig.darwin.hasShadow);
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
  state.mainWindow.on('focus', handleWindowFocus);
  state.mainWindow.on('blur', handleWindowBlur);

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

function handleWindowFocus(): void {
  console.log('Window gained focus - preserving configuration');
  preserveWindowConfiguration();
}

function handleWindowBlur(): void {
  console.log('Window lost focus - will preserve configuration on next focus');
}

function preserveWindowConfiguration(): void {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) {
    return;
  }

  try {
    const windowConfig = WindowConfigFactory.getInstance().getConfig(state.appMode);
    
    // Re-apply platform-specific configurations to prevent OS overrides
    const platformConfig = windowConfig.behavior.platformSpecific;
    
    // macOS-specific settings
    if (process.platform === 'darwin' && platformConfig.darwin) {
      state.mainWindow.setWindowButtonVisibility(
        platformConfig.darwin.windowButtonVisibility,
      );
      state.mainWindow.setHiddenInMissionControl(
        platformConfig.darwin.hiddenInMissionControl,
      );
      state.mainWindow.setBackgroundColor(platformConfig.darwin.backgroundColor);
      state.mainWindow.setHasShadow(platformConfig.darwin.hasShadow);
    }

    // Windows-specific settings
    if (process.platform === 'win32') {
      // On Windows, ensure the menu bar stays hidden
      state.mainWindow.setMenuBarVisibility(false);
      state.mainWindow.setAutoHideMenuBar(true);
    }

    // Cross-platform: Re-apply critical frameless window settings
    // Note: The frame and titleBarStyle are set at window creation and cannot be changed dynamically
    // But we can re-apply other settings that might get overridden by the OS
    
    console.log('Window configuration preserved for platform:', process.platform);
  } catch (error) {
    console.error('Error preserving window configuration:', error);
  }
}

function hideMainWindow(): void {
  if (!state.mainWindow?.isDestroyed()) {
    console.log('Hiding main window...');

    const bounds = state.mainWindow.getBounds();
    state.windowPosition = { x: bounds.x, y: bounds.y };
    state.windowSize = { width: bounds.width, height: bounds.height };

    const configFactory = WindowConfigFactory.getInstance();
    configFactory.applyHideBehavior(state.mainWindow, state.appMode);
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

    const configFactory = WindowConfigFactory.getInstance();
    const view = getView();

    state.mainWindow.setOpacity(0);
    state.mainWindow.showInactive();

    // Apply appropriate behavior based on current view
    if (view === 'queue') {
      const screenshots = getScreenshotQueue();
      const hasScreenshots = screenshots.length > 0;
      console.log(
        `showMainWindow: in Queue mode with ${screenshots.length} screenshots`,
      );
      configFactory.applyQueueBehavior(
        state.mainWindow,
        state.appMode,
        hasScreenshots,
      );
    } else {
      configFactory.applyShowBehavior(state.mainWindow, state.appMode);
    }

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
  console.log(
    `moveWindowHorizontal: OLD x: ${state.currentX}  y: ${state.currentY}`,
  );
  state.currentX = updateFn(state.currentX);
  state.mainWindow.setPosition(
    Math.round(state.currentX),
    Math.round(state.currentY),
  );
  console.log(
    `moveWindowHorizontal: NEW x: ${state.currentX}  y: ${state.currentY}`,
  );
}

function moveWindowVertical(updateFn: (y: number) => number): void {
  if (!state.mainWindow || !state.windowSize) {
    return;
  }

  const newY = updateFn(state.currentY);
  // Allow window to go 2/3 off screen in either direction
  const maxUpLimit = (-(state.windowSize.height || 0) * 2) / 3;
  const maxDownLimit =
    state.screenHeight + ((state.windowSize.height || 0) * 2) / 3;
  console.log(
    `height: ${state.windowSize.height} | maxUpLimit: ${maxUpLimit} | maxDownLimit: ${maxDownLimit}`,
  );

  // Only update if within bounds
  if (newY >= maxUpLimit && newY <= maxDownLimit) {
    state.currentY = newY;
    state.mainWindow.setPosition(
      Math.round(state.currentX),
      Math.round(state.currentY),
    );
  }
}

function isWindowCompletelyOffScreen(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize;

  return (
    x + width < 0 || // Completely left of screen
    x > workArea.width || // Completely right of screen
    y + height < 0 || // Completely above screen
    y > workArea.height // Completely below screen
  );
}

function setWindowDimensions(
  width: number,
  height: number,
  _source: string,
): void {
  if (state.mainWindow && !state.mainWindow.isDestroyed()) {
    const [currentX, currentY] = state.mainWindow.getPosition();
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workAreaSize;
    const maxWidth = Math.floor(workArea.width * 0.4);

    // let extra = 0;
    // // TODO: prevents infinite resize loops (bug with hooks and updateContentDimensions())
    // if (source !== 'SubscribedApp') {
    //   extra = 32;
    // }
    const newWidth = Math.min(width + 32, maxWidth);
    const newHeight = Math.ceil(height);

    // Only adjust position if window would be completely off-screen
    let adjustedX = currentX;
    let adjustedY = currentY;
    if (isWindowCompletelyOffScreen(currentX, currentY, newWidth, newHeight)) {
      // Only in extreme cases, center the window
      adjustedX = Math.max(0, (workArea.width - newWidth) / 2);
      adjustedY = Math.max(0, (workArea.height - newHeight) / 2);
    }

    state.mainWindow.setBounds({
      x: adjustedX,
      y: adjustedY,
      width: newWidth,
      height: newHeight,
    });

    // Update internal state to match actual position
    state.currentX = adjustedX;
    state.currentY = adjustedY;
    state.windowPosition = { x: adjustedX, y: adjustedY };
    state.windowSize = { width: newWidth, height: newHeight };
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
      getAppMode,
      setAppMode,
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
      applyQueueWindowBehavior,
      writeText,
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

function getAppMode(): AppMode {
  return state.appMode;
}

function setAppMode(appMode: AppMode): void {
  state.appMode = appMode;
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

function preserveWindowPosition<T>(operation: () => T): T {
  if (state.mainWindow && !state.mainWindow.isDestroyed()) {
    const bounds = state.mainWindow.getBounds();
    state.windowPosition = { x: bounds.x, y: bounds.y };
    state.windowSize = { width: bounds.width, height: bounds.height };
    state.currentX = bounds.x;
    state.currentY = bounds.y;
  }

  const result = operation();

  if (
    state.mainWindow &&
    !state.mainWindow.isDestroyed() &&
    state.windowPosition &&
    state.windowSize
  ) {
    state.mainWindow.setBounds({
      ...state.windowPosition,
      ...state.windowSize,
    });
  }

  return result;
}

function applyQueueWindowBehavior(): void {
  if (state.mainWindow && !state.mainWindow.isDestroyed()) {
    preserveWindowPosition(() => {
      const configFactory = WindowConfigFactory.getInstance();
      const screenshots = getScreenshotQueue();
      const hasScreenshots = screenshots.length > 0;

      configFactory.applyQueueBehavior(
        state.mainWindow,
        state.appMode,
        hasScreenshots,
      );
    });
  }
}

async function writeText(
  text: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    clipboard.writeText(text);

    return Promise.resolve({ success: true });
  } catch (error) {
    return Promise.resolve({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy text',
    });
  }
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
  getAppMode,
  setAppMode,
  getScreenshotHelper,
  getScreenshotQueue,
  getExtraScreenshotQueue,
  clearQueues,
  takeScreenshot,
  getImagePreview,
  deleteScreenshot,
  setHasDebugged,
  getHasDebugged,
  applyQueueWindowBehavior,
  preserveWindowPosition,
};

app.whenReady().then(initializeApp).catch(console.error);

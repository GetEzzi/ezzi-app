import { app, ipcMain, shell } from 'electron';
import { IIpcHandlerDeps } from './main';
import { IPC_EVENTS } from '../shared/constants';
import { AppMode } from '../shared/api';
import { AuthStorage } from './auth.storage';

export function initializeIpcHandlers(deps: IIpcHandlerDeps): void {
  console.log('Initializing IPC handlers');

  const authStorage = AuthStorage.getInstance();

  ipcMain.handle(IPC_EVENTS.TOOLTIP.MOUSE_ENTER, () => {
    console.log('Tooltip mouse enter');
  });

  ipcMain.handle(IPC_EVENTS.TOOLTIP.MOUSE_LEAVE, () => {
    console.log('Tooltip mouse leave');
  });

  ipcMain.handle(IPC_EVENTS.TOOLTIP.CLOSE_CLICK, () => {
    console.log('Tooltip close button clicked - closing application');
    app.quit();
  });

  ipcMain.handle(IPC_EVENTS.QUEUE.LOADED_NO_SCREENSHOTS, () => {
    console.log('Queue page loaded with no screenshots');
    deps.applyQueueWindowBehavior();
  });

  ipcMain.handle(
    IPC_EVENTS.QUEUE.LOADED_WITH_SCREENSHOTS,
    (event, screenshotCount) => {
      console.log('Queue page loaded with screenshots:', screenshotCount);
      deps.applyQueueWindowBehavior();
    },
  );

  // Screenshot queue handlers
  ipcMain.handle('get-screenshot-queue', () => {
    return deps.getScreenshotQueue();
  });

  ipcMain.handle('get-extra-screenshot-queue', () => {
    return deps.getExtraScreenshotQueue();
  });

  ipcMain.handle('delete-screenshot', async (event, path: string) => {
    return deps.deleteScreenshot(path);
  });

  ipcMain.handle('get-image-preview', async (event, path: string) => {
    return deps.getImagePreview(path);
  });

  // Window dimension handlers
  ipcMain.handle(
    'update-content-dimensions',
    (
      event,
      {
        width,
        height,
        source,
      }: { width: number; height: number; source: string },
    ) => {
      // TODO: issue - chain called while window is idle at start
      console.log(
        'Received content dimensions - width:',
        width,
        'height:',
        height,
        'source:',
        source,
      );

      if (width && height) {
        deps.setWindowDimensions(width, height);
      }
    },
  );

  ipcMain.handle(
    'set-window-dimensions',
    (event, width: number, height: number) => {
      deps.setWindowDimensions(width, height);
    },
  );

  // Screenshot management handlers
  ipcMain.handle('get-screenshots', async () => {
    try {
      let previews: {
        path: string;
        preview: string;
      }[];
      const currentView = deps.getView();

      if (currentView === 'queue') {
        const queue = deps.getScreenshotQueue();
        previews = await Promise.all(
          queue.map(async (path) => ({
            path,
            preview: await deps.getImagePreview(path),
          })),
        );
      } else {
        const extraQueue = deps.getExtraScreenshotQueue();
        previews = await Promise.all(
          extraQueue.map(async (path) => ({
            path,
            preview: await deps.getImagePreview(path),
          })),
        );
      }

      return previews;
    } catch (error) {
      console.error('Error getting screenshots:', error);

      throw error;
    }
  });

  // Screenshot trigger handlers
  ipcMain.handle('trigger-screenshot', async () => {
    const mainWindow = deps.getMainWindow();
    if (mainWindow) {
      try {
        const screenshotPath = await deps.takeScreenshot();
        const preview = await deps.getImagePreview(screenshotPath);
        mainWindow.webContents.send('screenshot-taken', {
          path: screenshotPath,
          preview,
        });

        return { success: true };
      } catch (error) {
        console.error('Error triggering screenshot:', error);

        return { error: 'Failed to trigger screenshot' };
      }
    }

    return { error: 'No main window available' };
  });

  ipcMain.handle('take-screenshot', async () => {
    try {
      const screenshotPath = await deps.takeScreenshot();
      const preview = await deps.getImagePreview(screenshotPath);

      return { path: screenshotPath, preview };
    } catch (error) {
      console.error('Error taking screenshot:', error);

      return { error: 'Failed to take screenshot' };
    }
  });

  ipcMain.handle('open-external-url', (event, url: string) => {
    shell.openExternal(url).catch(console.error);
  });

  ipcMain.handle('open-settings-portal', () => {
    shell.openExternal('https://getezzi.com/settings').catch(console.error);
  });

  ipcMain.handle('open-subscription-portal', async () => {
    try {
      // TODO: replace with our url
      const url = 'https://getezzi.com/en/personal/billing';
      await shell.openExternal(url);

      return { success: true };
    } catch (error) {
      console.error('Error opening checkout page:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to open checkout page',
      };
    }
  });

  // Window management handlers
  ipcMain.handle('toggle-window', () => {
    try {
      deps.toggleMainWindow();

      return { success: true };
    } catch (error) {
      console.error('Error toggling window:', error);

      return { error: 'Failed to toggle window' };
    }
  });

  ipcMain.handle('reset-queues', () => {
    try {
      deps.clearQueues();

      return { success: true };
    } catch (error) {
      console.error('Error resetting queues:', error);

      return { error: 'Failed to reset queues' };
    }
  });

  // Reset handlers
  ipcMain.handle('trigger-reset', () => {
    try {
      // First cancel any ongoing requests
      deps.processingHelper?.cancelOngoingRequests();

      // Clear all queues immediately
      deps.clearQueues();

      // Reset view to queue
      deps.setView('queue');

      // Get main window and send reset events
      const mainWindow = deps.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('reset-view');
      }

      return { success: true };
    } catch (error) {
      console.error('Error triggering reset:', error);

      return { error: 'Failed to trigger reset' };
    }
  });

  // Window movement handlers
  ipcMain.handle('trigger-move-left', () => {
    try {
      deps.moveWindowLeft();

      return { success: true };
    } catch (error) {
      console.error('Error moving window left:', error);

      return { error: 'Failed to move window left' };
    }
  });

  ipcMain.handle('trigger-move-right', () => {
    try {
      deps.moveWindowRight();

      return { success: true };
    } catch (error) {
      console.error('Error moving window right:', error);

      return { error: 'Failed to move window right' };
    }
  });

  ipcMain.handle('trigger-move-up', () => {
    try {
      deps.moveWindowUp();

      return { success: true };
    } catch (error) {
      console.error('Error moving window up:', error);

      return { error: 'Failed to move window up' };
    }
  });

  ipcMain.handle('trigger-move-down', () => {
    try {
      deps.moveWindowDown();

      return { success: true };
    } catch (error) {
      console.error('Error moving window down:', error);

      return { error: 'Failed to move window down' };
    }
  });

  // Auth token handlers
  ipcMain.handle(
    'auth-set-token',
    (event, token: string, expiryTimestamp?: number) => {
      try {
        authStorage.setAuthToken(token, expiryTimestamp);

        return { success: true };
      } catch (error) {
        console.error('Error setting auth token:', error);

        return { error: 'Failed to set auth token' };
      }
    },
  );

  ipcMain.handle('auth-get-token', () => {
    try {
      const token = authStorage.getAuthToken();

      return { success: true, token };
    } catch (error) {
      console.error('Error getting auth token:', error);

      return { error: 'Failed to get auth token' };
    }
  });

  ipcMain.handle('auth-clear-token', () => {
    try {
      authStorage.clearAuthToken();

      return { success: true };
    } catch (error) {
      console.error('Error clearing auth token:', error);

      return { error: 'Failed to clear auth token' };
    }
  });

  ipcMain.handle('auth-is-authenticated', () => {
    try {
      const isAuthenticated = authStorage.isAuthenticated();

      return { success: true, isAuthenticated };
    } catch (error) {
      console.error('Error checking authentication:', error);

      return { error: 'Failed to check authentication' };
    }
  });

  ipcMain.handle(IPC_EVENTS.APP_MODE.CHANGE, (event, appMode: string) => {
    try {
      console.log('App mode changed to:', appMode);

      if (Object.values(AppMode).includes(appMode as AppMode)) {
        deps.setAppMode(appMode as AppMode);

        const mainWindow = deps.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          const currentView = deps.getView();
          if (currentView === 'queue') {
            deps.applyQueueWindowBehavior();
          }
        }
      } else {
        return { error: 'Invalid app mode' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error changing app mode:', error);

      return { error: 'Failed to change app mode' };
    }
  });
}

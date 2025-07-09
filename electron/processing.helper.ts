import fs from 'node:fs';
import { ScreenshotHelper } from './screenshot.helper';
import { IProcessingHelperDeps } from './main';
import axios, { AxiosResponse } from 'axios';
import { BrowserWindow } from 'electron';
import { AuthStorage } from './auth.storage';
import {
  API_ENDPOINTS,
  DebugRequest,
  DebugResponse,
  SolveRequest,
  SolveResponse,
} from '../shared/api';

// Import API_BASE_URL from shared constants
import { API_BASE_URL, isSelfHosted } from '../shared/constants';

export class ProcessingHelper {
  private deps: IProcessingHelperDeps;
  private screenshotHelper: ScreenshotHelper;
  private authStorage: AuthStorage;

  // AbortControllers for API requests
  private currentProcessingAbortController: AbortController | null = null;
  private currentExtraProcessingAbortController: AbortController | null = null;

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps;
    this.screenshotHelper = deps.getScreenshotHelper();
    this.authStorage = AuthStorage.getInstance();
  }

  private async waitForInitialization(
    mainWindow: BrowserWindow,
  ): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total

    while (attempts < maxAttempts) {
      const isInitialized = (await mainWindow.webContents.executeJavaScript(
        'window.__IS_INITIALIZED__',
      )) as boolean;
      if (isInitialized) {
        return;
      }
      // !!! Required because window lags sometimes
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    throw new Error('App failed to initialize after 5 seconds');
  }

  private async getLanguage(): Promise<string> {
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow) {
      return 'python';
    }

    try {
      await this.waitForInitialization(mainWindow);
      const language: string = (await mainWindow.webContents.executeJavaScript(
        'window.__LANGUAGE__',
      )) as string;

      if (typeof language !== 'string') {
        console.warn('Language not properly initialized');

        return 'python';
      }

      return language;
    } catch (error) {
      console.error('Error getting language:', error);

      return 'python';
    }
  }

  private async getLocale(): Promise<string> {
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow) {
      return 'en-US';
    }

    try {
      await this.waitForInitialization(mainWindow);
      const locale = (await mainWindow.webContents.executeJavaScript(
        'window.__LOCALE__',
      )) as string;

      if (typeof locale !== 'string') {
        console.warn('Locale not properly initialized');

        return 'en-US';
      }

      return locale;
    } catch (error) {
      console.error('Error getting locale:', error);

      return 'python';
    }
  }

  private getAuthToken(): string | null {
    // In self-hosted mode, skip authentication
    if (isSelfHosted()) {
      return null;
    }

    try {
      const token = this.authStorage.getAuthToken();
      if (!token) {
        console.warn('No auth token found');

        return null;
      }

      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);

      return null;
    }
  }

  public async processScreenshotsSolve(): Promise<void> {
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow) {
      return;
    }

    const view = this.deps.getView();
    console.log('Processing screenshots in view:', view);

    if (view === 'queue') {
      const screenshotQueue = this.screenshotHelper.getScreenshotQueue();
      console.log('Processing main queue screenshots:', screenshotQueue);
      if (screenshotQueue.length === 0) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);

        return;
      }

      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START);

      try {
        this.currentProcessingAbortController = new AbortController();
        const { signal } = this.currentProcessingAbortController;

        const screenshots = await Promise.all(
          screenshotQueue.map(async (path) => ({
            path,
            preview: await this.screenshotHelper.getImagePreview(path),
            data: fs.readFileSync(path).toString('base64'),
          })),
        );

        const result = await this.processScreenshotsHelperSolve(
          screenshots,
          signal,
        );

        if (!result.success) {
          console.log('Processing failed:', result.error);
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            result.error,
          );
          console.log('Resetting view to queue due to error');
          this.deps.setView('queue');

          return;
        }

        // Only set view to solutions if processing succeeded
        console.log('Setting view to solutions after successful processing');
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
          result.data,
        );
        this.deps.setView('solutions');
      } catch (error: any) {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
          error,
        );
        console.error('Processing error:', error);
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            'Processing was canceled by the user.',
          );
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            (error as Error).message || 'Server error. Please try again.',
          );
        }
        // Reset view back to queue on error
        console.log('Resetting view to queue due to error');
        this.deps.setView('queue');
      } finally {
        this.currentProcessingAbortController = null;
      }
    } else {
      // view == 'solutions'
      const extraScreenshotQueue =
        this.screenshotHelper.getExtraScreenshotQueue();
      console.log('Processing extra queue screenshots:', extraScreenshotQueue);
      if (extraScreenshotQueue.length === 0) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);

        return;
      }
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.DEBUG_START);

      // Initialize AbortController
      this.currentExtraProcessingAbortController = new AbortController();
      const { signal } = this.currentExtraProcessingAbortController;

      try {
        const screenshots = await Promise.all(
          [
            ...this.screenshotHelper.getScreenshotQueue(),
            ...extraScreenshotQueue,
          ].map(async (path) => ({
            path,
            preview: await this.screenshotHelper.getImagePreview(path),
            data: fs.readFileSync(path).toString('base64'),
          })),
        );
        console.log(
          'Combined screenshots for processing:',
          screenshots.map((s) => s.path),
        );

        const result = await this.processExtraScreenshotsHelper(
          screenshots,
          signal,
        );

        if (result.success) {
          this.deps.setHasDebugged(true);
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_SUCCESS,
            result.data,
          );
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            result.error,
          );
        }
      } catch (error: any) {
        console.error('Extra processing error:', error);
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            'Extra processing was canceled by the user.',
          );
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            (error as Error).message,
          );
        }
      } finally {
        this.currentExtraProcessingAbortController = null;
      }
    }
  }

  private async processScreenshotsHelperSolve(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal,
  ) {
    try {
      const images = screenshots.map((screenshot) => screenshot.data);
      const mainWindow = this.deps.getMainWindow();
      const language = await this.getLanguage();
      const locale = await this.getLocale();
      const isMock = process.env.IS_MOCK === 'true';
      if (isMock) {
        console.log('Running mock mode');
      }
      let solutionData: SolveResponse;

      if (!mainWindow) {
        return;
      }

      try {
        const token = this.getAuthToken();
        if (!isSelfHosted() && !token) {
          return {
            success: false,
            error: 'Authentication required. Please log in.',
          };
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Only add auth header if not in self-hosted mode
        if (!isSelfHosted() && token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const extractResponse = await axios.post<
          SolveRequest,
          AxiosResponse<SolveResponse>
        >(
          `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.SOLVE}`,
          {
            images,
            language,
            isMock,
            locale,
          },
          {
            signal,
            timeout: 300000,
            headers,
          },
        );

        solutionData = extractResponse.data;

        this.screenshotHelper.clearExtraScreenshotQueue();
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
          solutionData,
        );

        console.log('Solution retrieved and sent to app');

        return { success: true, data: solutionData };
      } catch (error: any) {
        if (axios.isCancel(error)) {
          return {
            success: false,
            error: 'Processing was canceled by the user.',
          };
        }

        console.error('API Error Details:', {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          status: error.response?.status,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          data: error.response?.data,
          message: (error as Error).message,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          code: error.code,
        });

        throw new Error(
          (error as Error).message || 'Server error. Please try again.',
        );
      }
    } catch (error: any) {
      console.error('Processing error details:', {
        message: (error as Error).message,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        code: error.code,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        response: error.response?.data,
      });

      if (axios.isCancel(error)) {
        return { success: false, error: error.message };
      }
    }

    return {
      success: false,
      error: 'Failed to process. Please try again.',
    };
  }

  private async processExtraScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal,
  ) {
    try {
      const images = screenshots.map((screenshot) => screenshot.data);
      const language = await this.getLanguage();
      const locale = await this.getLocale();
      const token = this.getAuthToken();
      const isMock = process.env.IS_MOCK === 'true';
      if (isMock) {
        console.log('Running mock mode');
      }

      if (!isSelfHosted() && !token) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Only add auth header if not in self-hosted mode
      if (!isSelfHosted() && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post<
        DebugRequest,
        AxiosResponse<DebugResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.DEBUG}`,
        { images, language, isMock, locale },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (error.response?.data?.error?.includes('Operation timed out')) {
        const mainWindow = this.deps.getMainWindow();
        // Cancel ongoing API requests
        this.cancelOngoingRequests();
        // Clear both screenshot queues
        this.deps.clearQueues();
        // Update view state to queue
        this.deps.setView('queue');
        // Notify renderer to switch view
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('reset-view');
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            'Operation timed out after 1 minute. Please try again.',
          );
        }

        return {
          success: false,
          error: 'Operation timed out after 1 minute. Please try again.',
        };
      }

      return { success: false, error: (error as Error).message };
    }
  }

  public cancelOngoingRequests(): void {
    let wasCancelled = false;

    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort();
      this.currentProcessingAbortController = null;
      wasCancelled = true;
    }

    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort();
      this.currentExtraProcessingAbortController = null;
      wasCancelled = true;
    }

    // Reset hasDebugged flag
    this.deps.setHasDebugged(false);

    const mainWindow = this.deps.getMainWindow();
    if (wasCancelled && mainWindow && !mainWindow.isDestroyed()) {
      // Send a clear message that processing was cancelled
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
    }
  }
}

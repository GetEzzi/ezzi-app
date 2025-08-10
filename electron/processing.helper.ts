import fs from 'node:fs';
import { ScreenshotHelper } from './screenshot.helper';
import { IProcessingHelperDeps } from './main';
import axios from 'axios';
import { BrowserWindow } from 'electron';
import { AuthStorage } from './auth.storage';
import {
  DebugResponse,
  LeetCodeDebugResponse,
  LeetCodeSolveResponse,
  SolveResponse,
} from '../shared/api';
import { AppModeProcessorFactory } from './processors/AppModeProcessorFactory';
import { ProcessingParams } from './processors/AppModeProcessor';
import { isSelfHosted } from '../shared/constants';

export class ProcessingHelper {
  private deps: IProcessingHelperDeps;
  private screenshotHelper: ScreenshotHelper;
  private authStorage: AuthStorage;
  private processorFactory: AppModeProcessorFactory;

  // AbortControllers for API requests
  private currentProcessingAbortController: AbortController | null = null;
  private currentExtraProcessingAbortController: AbortController | null = null;

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps;
    this.screenshotHelper = deps.getScreenshotHelper();
    this.authStorage = AuthStorage.getInstance();
    this.processorFactory = AppModeProcessorFactory.getInstance();
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
      // view == 'solutions' or 'debug' - process debug screenshots
      const screenshotQueue = this.screenshotHelper.getScreenshotQueue();
      console.log('Processing debug screenshots:', screenshotQueue);
      if (screenshotQueue.length === 0) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);

        return;
      }
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.DEBUG_START);

      // Initialize AbortController
      this.currentExtraProcessingAbortController = new AbortController();
      const { signal } = this.currentExtraProcessingAbortController;

      try {
        const screenshots = await Promise.all(
          screenshotQueue.map(async (path) => ({
            path,
            preview: await this.screenshotHelper.getImagePreview(path),
            data: fs.readFileSync(path).toString('base64'),
          })),
        );
        console.log(
          'Debug screenshots for processing:',
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
        console.error('Debug processing error:', error);
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            'Debug processing was canceled by the user.',
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
  ): Promise<{
    success: boolean;
    data?: SolveResponse | LeetCodeSolveResponse;
    error?: string;
  }> {
    try {
      const images = screenshots.map((screenshot) => screenshot.data);
      const mainWindow = this.deps.getMainWindow();
      const isMock = process.env.IS_MOCK === 'true';
      if (isMock) {
        console.log('Running mock mode');
      }
      const currentAppMode = this.deps.getAppMode();
      const processor = this.processorFactory.getProcessor(currentAppMode);

      if (!mainWindow) {
        return {
          success: false,
          error: 'Main window not available',
        };
      }

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

      const processingParams: ProcessingParams = {
        images,
        isMock,
        signal,
        headers,
      };

      const result = await processor.processSolve(processingParams);

      if (!result.success) {
        return result;
      }

      const solutionData = result.data;

      if (solutionData && 'conversationId' in solutionData) {
        this.deps.setConversationId(solutionData.conversationId);
        console.log('Stored conversationId:', solutionData.conversationId);
      }

      mainWindow.webContents.send(
        this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
        solutionData,
      );

      console.log('Solution retrieved and sent to app');

      return { success: true, data: solutionData };
    } catch (error: unknown) {
      console.error('Processing Helper Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }

  private async processExtraScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal,
  ): Promise<{
    success: boolean;
    data?: DebugResponse | LeetCodeDebugResponse;
    error?: string;
  }> {
    try {
      const images = screenshots.map((screenshot) => screenshot.data);
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

      const currentAppMode = this.deps.getAppMode();
      const processor = this.processorFactory.getProcessor(currentAppMode);

      const processingParams: ProcessingParams = {
        images,
        isMock,
        signal,
        headers,
        conversationId: this.deps.getConversationId() || undefined,
      };

      return await processor.processDebug(processingParams);
    } catch (error: unknown) {
      console.error('Debug Processing Helper Error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
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

    // Reset hasDebugged flag and reset screenshot queue for debug
    this.deps.setHasDebugged(false);
    this.screenshotHelper.resetQueue();

    const mainWindow = this.deps.getMainWindow();
    if (wasCancelled && mainWindow && !mainWindow.isDestroyed()) {
      // Send a clear message that processing was cancelled
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
    }
  }
}

import { BrowserWindow } from 'electron';
import { AppMode } from '../../shared/api';
import {
  WindowConfig,
  WindowConfigProvider,
  WindowVisibilityConfig,
} from './WindowConfig';
import { LiveInterviewConfig } from './configs/LiveInterviewConfig';
import { LeetCodeSolverConfig } from './configs/LeetCodeSolverConfig';

export class WindowConfigFactory implements WindowConfigProvider {
  private static instance: WindowConfigFactory;

  private constructor() {}

  public static getInstance(): WindowConfigFactory {
    if (!WindowConfigFactory.instance) {
      WindowConfigFactory.instance = new WindowConfigFactory();
    }

    return WindowConfigFactory.instance;
  }

  public getConfig(appMode: AppMode): WindowConfig {
    switch (appMode) {
      case AppMode.LIVE_INTERVIEW:
        return LiveInterviewConfig;
      case AppMode.LEETCODE_SOLVER:
        return LeetCodeSolverConfig;
      default:
        return LiveInterviewConfig;
    }
  }

  private applyVisibilityConfig(
    window: BrowserWindow,
    config: WindowVisibilityConfig,
  ): void {
    const currentBounds = window.getBounds();

    if (config.ignoreMouseEvents) {
      window.setIgnoreMouseEvents(true, { forward: true });
    } else {
      window.setIgnoreMouseEvents(false);
    }
    window.setFocusable(config.focusable);
    window.setSkipTaskbar(config.skipTaskbar);
    window.setAlwaysOnTop(config.alwaysOnTop, config.alwaysOnTopLevel, 1);
    window.setVisibleOnAllWorkspaces(config.visibleOnAllWorkspaces, {
      visibleOnFullScreen: config.visibleOnFullScreen,
    });
    window.setContentProtection(config.contentProtection);
    window.setOpacity(config.opacity);

    window.setBounds(currentBounds);
  }

  private applyPlatformSpecificConfig(
    window: BrowserWindow,
    appMode: AppMode,
  ): void {
    const config = this.getConfig(appMode);
    const platformConfig = config.behavior.platformSpecific;

    // Apply macOS-specific configurations
    if (process.platform === 'darwin' && platformConfig.darwin) {
      window.setHiddenInMissionControl(
        platformConfig.darwin.hiddenInMissionControl,
      );
      window.setWindowButtonVisibility(
        platformConfig.darwin.windowButtonVisibility,
      );
      window.setBackgroundColor(platformConfig.darwin.backgroundColor);
      window.setHasShadow(platformConfig.darwin.hasShadow);
    }

    // Apply Windows-specific configurations
    if (process.platform === 'win32' && platformConfig.win32) {
      // Note: thickFrame must be set during window creation, but we can log for debugging
      console.log('Windows platform config applied:', platformConfig.win32);
    }
  }

  public applyQueueBehavior(
    window: BrowserWindow,
    appMode: AppMode,
    hasScreenshots: boolean,
  ): void {
    const config = this.getConfig(appMode);
    const queueConfig = hasScreenshots
      ? config.behavior.queueBehavior.queueWithScreenshots
      : config.behavior.queueBehavior.queueEmpty;

    this.applyVisibilityConfig(window, queueConfig);
    this.applyPlatformSpecificConfig(window, appMode);
  }

  public applyShowBehavior(window: BrowserWindow, appMode: AppMode): void {
    const config = this.getConfig(appMode);
    this.applyVisibilityConfig(window, config.behavior.showBehavior);
    this.applyPlatformSpecificConfig(window, appMode);
  }

  public applyHideBehavior(window: BrowserWindow, appMode: AppMode): void {
    const config = this.getConfig(appMode);
    this.applyVisibilityConfig(window, config.behavior.hideBehavior);
    this.applyPlatformSpecificConfig(window, appMode);
  }
}

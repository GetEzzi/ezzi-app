import { BrowserWindow } from 'electron';
import { AppMode } from '../../shared/api';
import {
  WindowConfig,
  WindowConfigProvider,
  WindowVisibilityConfig,
} from './WindowConfig';
import { LiveInterviewConfig } from './configs/LiveInterviewConfig';

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
        return LiveInterviewConfig;
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
  }

  public applyShowBehavior(window: BrowserWindow, appMode: AppMode): void {
    const config = this.getConfig(appMode);
    this.applyVisibilityConfig(window, config.behavior.showBehavior);
  }

  public applyHideBehavior(window: BrowserWindow, appMode: AppMode): void {
    const config = this.getConfig(appMode);
    this.applyVisibilityConfig(window, config.behavior.hideBehavior);
  }
}

import { BrowserWindowConstructorOptions } from 'electron';
import { AppMode } from '../../shared/api';

export interface WindowVisibilityConfig {
  opacity: number;
  ignoreMouseEvents: boolean;
  skipTaskbar: boolean;
  alwaysOnTop: boolean;
  alwaysOnTopLevel:
    | 'normal'
    | 'floating'
    | 'torn-off-menu'
    | 'modal-panel'
    | 'main-menu'
    | 'status'
    | 'pop-up-menu'
    | 'screen-saver';
  visibleOnAllWorkspaces: boolean;
  visibleOnFullScreen: boolean;
  focusable: boolean;
  contentProtection: boolean;
}

export interface WindowPlatformConfig {
  darwin?: {
    hiddenInMissionControl: boolean;
    windowButtonVisibility: boolean;
    backgroundColor: string;
    hasShadow: boolean;
  };
  win32?: {
    thickFrame: boolean;
  };
}

export interface WindowQueueBehaviorConfig {
  queueEmpty: WindowVisibilityConfig;
  queueWithScreenshots: WindowVisibilityConfig;
}

export interface WindowBehaviorConfig {
  showBehavior: WindowVisibilityConfig;
  hideBehavior: WindowVisibilityConfig;
  queueBehavior: WindowQueueBehaviorConfig;
  platformSpecific: WindowPlatformConfig;
}

export interface WindowConfig {
  baseSettings: BrowserWindowConstructorOptions;
  behavior: WindowBehaviorConfig;
}

export interface WindowConfigProvider {
  getConfig(appMode: AppMode): WindowConfig;
}

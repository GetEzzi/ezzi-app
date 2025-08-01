import { IStorageProvider, UserSettings } from './StorageProvider';
import {
  ProgrammingLanguage,
  UserLanguage,
  AppMode,
  UserSettingsUpdateRequest,
} from '@shared/api.ts';
import { settingsService } from '../settings';

export class ApiStorageProvider implements IStorageProvider {
  async getSettings(): Promise<UserSettings> {
    const settings = await settingsService.getSettings();

    return {
      solutionLanguage: settings.solutionLanguage,
      userLanguage: settings.userLanguage,
      appMode: AppMode.LIVE_INTERVIEW,
    };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings: UserSettingsUpdateRequest = {
      solutionLanguage:
        settings.solutionLanguage ?? currentSettings.solutionLanguage,
      userLanguage: settings.userLanguage ?? currentSettings.userLanguage,
    };
    await settingsService.updateSettings(updatedSettings);
  }

  async getSolutionLanguage(): Promise<ProgrammingLanguage> {
    const settings = await this.getSettings();

    return settings.solutionLanguage;
  }

  async setSolutionLanguage(language: ProgrammingLanguage): Promise<void> {
    await this.updateSettings({ solutionLanguage: language });
  }

  async getUserLanguage(): Promise<UserLanguage> {
    const settings = await this.getSettings();

    return settings.userLanguage;
  }

  async setUserLanguage(language: UserLanguage): Promise<void> {
    await this.updateSettings({ userLanguage: language });
  }

  getAppMode(): Promise<AppMode> {
    return Promise.resolve(AppMode.LIVE_INTERVIEW);
  }

  setAppMode(appMode: AppMode): Promise<void> {
    console.log(
      'App mode change not persisted in API storage provider:',
      appMode,
    );

    return Promise.resolve();
  }
}

import { IStorageProvider, UserSettings } from './StorageProvider';
import { ProgrammingLanguage, UserLanguage, AppMode } from '@shared/api.ts';

export class LocalStorageProvider implements IStorageProvider {
  private readonly STORAGE_KEY = 'ezzi-settings';

  getSettings(): Promise<UserSettings> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          solutionLanguage?: ProgrammingLanguage;
          userLanguage?: UserLanguage;
          appMode?: AppMode;
        };

        return Promise.resolve({
          solutionLanguage:
            parsed.solutionLanguage || ProgrammingLanguage.Python,
          userLanguage: parsed.userLanguage || UserLanguage.EN_US,
          appMode: parsed.appMode || AppMode.LIVE_INTERVIEW,
        });
      } catch (error) {
        console.warn('Failed to parse stored settings:', error);
      }
    }

    return Promise.resolve({
      solutionLanguage: ProgrammingLanguage.Python,
      userLanguage: UserLanguage.EN_US,
      appMode: AppMode.LIVE_INTERVIEW,
    });
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
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

  async getAppMode(): Promise<AppMode> {
    const settings = await this.getSettings();

    return settings.appMode;
  }

  async setAppMode(appMode: AppMode): Promise<void> {
    await this.updateSettings({ appMode });
  }
}

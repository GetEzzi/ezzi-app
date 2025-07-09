import { IStorageProvider, UserSettings } from './StorageProvider';
import { ProgrammingLanguage, UserLanguage } from '@shared/api.ts';

export class LocalStorageProvider implements IStorageProvider {
  private readonly STORAGE_KEY = 'ezzi-settings';

  getSettings(): Promise<UserSettings> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          solutionLanguage?: ProgrammingLanguage;
          userLanguage?: UserLanguage;
        };

        return Promise.resolve({
          solutionLanguage:
            parsed.solutionLanguage || ProgrammingLanguage.Python,
          userLanguage: parsed.userLanguage || UserLanguage.EN_US,
        });
      } catch (error) {
        console.warn('Failed to parse stored settings:', error);
      }
    }

    return Promise.resolve({
      solutionLanguage: ProgrammingLanguage.Python,
      userLanguage: UserLanguage.EN_US,
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
}

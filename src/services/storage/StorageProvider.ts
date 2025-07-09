import { ProgrammingLanguage, UserLanguage } from '@shared/api.ts';

export interface UserSettings {
  solutionLanguage: ProgrammingLanguage;
  userLanguage: UserLanguage;
}

export interface IStorageProvider {
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<void>;
  getSolutionLanguage(): Promise<ProgrammingLanguage>;
  setSolutionLanguage(language: ProgrammingLanguage): Promise<void>;
  getUserLanguage(): Promise<UserLanguage>;
  setUserLanguage(language: UserLanguage): Promise<void>;
}

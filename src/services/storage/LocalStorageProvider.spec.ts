import { AppMode, ProgrammingLanguage, UserLanguage } from '../../../shared/api';
import { LOCAL_STORAGE_KEYS } from '../../../shared/storage';
import { LocalStorageProvider } from './LocalStorageProvider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  describe('getSettings', () => {
    test('WHEN no settings stored THEN it returns Python/EN_US/LIVE_INTERVIEW defaults', async () => {
      // Act
      const settings = await provider.getSettings();

      // Assert
      expect(settings).toEqual({
        solutionLanguage: ProgrammingLanguage.Python,
        userLanguage: UserLanguage.EN_US,
        appMode: AppMode.LIVE_INTERVIEW,
      });
    });

    test('WHEN settings are stored THEN it returns parsed values', async () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.EZZI_SETTINGS,
        JSON.stringify({
          solutionLanguage: ProgrammingLanguage.JavaScript,
          userLanguage: UserLanguage.ES_ES,
          appMode: AppMode.LEETCODE_SOLVER,
        }),
      );

      // Act
      const settings = await provider.getSettings();

      // Assert
      expect(settings).toEqual({
        solutionLanguage: ProgrammingLanguage.JavaScript,
        userLanguage: UserLanguage.ES_ES,
        appMode: AppMode.LEETCODE_SOLVER,
      });
    });

    test('WHEN stored payload is malformed THEN it falls back to defaults', async () => {
      localStorage.setItem(LOCAL_STORAGE_KEYS.EZZI_SETTINGS, '{not-json');

      // Act
      const settings = await provider.getSettings();

      // Assert
      expect(settings).toEqual({
        solutionLanguage: ProgrammingLanguage.Python,
        userLanguage: UserLanguage.EN_US,
        appMode: AppMode.LIVE_INTERVIEW,
      });
    });
  });

  describe('updateSettings', () => {
    test('WHEN partial update applied THEN it merges with existing values', async () => {
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.EZZI_SETTINGS,
        JSON.stringify({
          solutionLanguage: ProgrammingLanguage.Python,
          userLanguage: UserLanguage.EN_US,
          appMode: AppMode.LIVE_INTERVIEW,
        }),
      );

      // Act
      await provider.updateSettings({ solutionLanguage: ProgrammingLanguage.Go });

      // Assert
      const persisted = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.EZZI_SETTINGS) ?? '{}');
      expect(persisted).toEqual({
        solutionLanguage: ProgrammingLanguage.Go,
        userLanguage: UserLanguage.EN_US,
        appMode: AppMode.LIVE_INTERVIEW,
      });
    });
  });

  describe('setSolutionLanguage', () => {
    test('WHEN setSolutionLanguage is called THEN getSolutionLanguage returns it', async () => {
      // Act
      await provider.setSolutionLanguage(ProgrammingLanguage.TypeScript);
      const language = await provider.getSolutionLanguage();

      // Assert
      expect(language).toBe(ProgrammingLanguage.TypeScript);
    });
  });

  describe('setUserLanguage', () => {
    test('WHEN setUserLanguage is called THEN getUserLanguage returns it', async () => {
      // Act
      await provider.setUserLanguage(UserLanguage.JA_JP);
      const language = await provider.getUserLanguage();

      // Assert
      expect(language).toBe(UserLanguage.JA_JP);
    });
  });

  describe('setAppMode', () => {
    test('WHEN setAppMode is called THEN getAppMode returns it', async () => {
      // Act
      await provider.setAppMode(AppMode.LEETCODE_SOLVER);
      const mode = await provider.getAppMode();

      // Assert
      expect(mode).toBe(AppMode.LEETCODE_SOLVER);
    });
  });
});

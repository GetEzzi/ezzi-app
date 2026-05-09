/* eslint-disable @typescript-eslint/unbound-method */
import { AppMode } from '../shared/api';
import { AppStorage, type IAppStore } from './app.storage';

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }));
});

function createMockAppStorage() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (AppStorage as any).instance = null;

  const appStorage = AppStorage.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const mockStore = (appStorage as any).store as jest.Mocked<IAppStore>;

  return { mockStore, appStorage };
}

describe('AppStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (AppStorage as any).instance = null;
  });

  describe('getInstance', () => {
    test('WHEN getInstance is called twice THEN it returns the same instance', () => {
      const instance1 = AppStorage.getInstance();
      const instance2 = AppStorage.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(AppStorage);
    });
  });

  describe('setAppMode', () => {
    test('WHEN setAppMode is called THEN it persists the mode', () => {
      const { mockStore, appStorage } = createMockAppStorage();

      // Act
      appStorage.setAppMode(AppMode.LEETCODE_SOLVER);

      // Assert
      expect(mockStore.set).toHaveBeenCalledWith('appMode', AppMode.LEETCODE_SOLVER);
    });
  });

  describe('getAppMode', () => {
    test('WHEN getAppMode is called and mode is stored THEN it returns the stored mode', () => {
      const { mockStore, appStorage } = createMockAppStorage();
      mockStore.get.mockReturnValueOnce(AppMode.LEETCODE_SOLVER);

      // Act
      const result = appStorage.getAppMode();

      // Assert
      expect(result).toBe(AppMode.LEETCODE_SOLVER);
      expect(mockStore.get).toHaveBeenCalledWith('appMode');
    });

    test('WHEN getAppMode is called and no mode is stored THEN it returns LIVE_INTERVIEW default', () => {
      const { mockStore, appStorage } = createMockAppStorage();
      mockStore.get.mockReturnValueOnce(null);

      // Act
      const result = appStorage.getAppMode();

      // Assert
      expect(result).toBe(AppMode.LIVE_INTERVIEW);
    });
  });

  describe('setReadableVarNames', () => {
    test('WHEN setReadableVarNames is called THEN it persists the boolean', () => {
      const { mockStore, appStorage } = createMockAppStorage();

      // Act
      appStorage.setReadableVarNames(true);

      // Assert
      expect(mockStore.set).toHaveBeenCalledWith('readableVarNames', true);
    });
  });

  describe('getReadableVarNames', () => {
    test('WHEN getReadableVarNames is called and stored value is true THEN it returns true', () => {
      const { mockStore, appStorage } = createMockAppStorage();
      mockStore.get.mockReturnValueOnce(true);

      // Act
      const result = appStorage.getReadableVarNames();

      // Assert
      expect(result).toBe(true);
      expect(mockStore.get).toHaveBeenCalledWith('readableVarNames');
    });

    test('WHEN getReadableVarNames is called and stored value is null THEN it returns false', () => {
      const { mockStore, appStorage } = createMockAppStorage();
      mockStore.get.mockReturnValueOnce(null);

      // Act
      const result = appStorage.getReadableVarNames();

      // Assert
      expect(result).toBe(false);
    });
  });
});

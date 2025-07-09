/* eslint-disable @typescript-eslint/unbound-method */
import { AuthStorage, IAuthStore } from './auth.storage';

// Mock electron-store with a factory function
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }));
});

function createMockAuthStorage() {
  // Reset AuthStorage singleton
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (AuthStorage as any).instance = null;

  // Get reference to the mocked store instance
  const authStorage = AuthStorage.getInstance();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const mockStore = (authStorage as any).store as jest.Mocked<IAuthStore>;

  return { mockStore, authStorage };
}

describe('AuthStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (AuthStorage as any).instance = null;
  });

  describe('getInstance', () => {
    test('WHEN getInstance is called THEN it returns singleton instance', () => {
      const instance1 = AuthStorage.getInstance();
      const instance2 = AuthStorage.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(AuthStorage);
    });
  });

  describe('setAuthToken', () => {
    test('WHEN setAuthToken is called with token only THEN it sets token without expiry', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const token = 'test-token';

      // Act
      authStorage.setAuthToken(token);

      // Assert
      expect(mockStore.set).toHaveBeenCalledWith('authToken', token);
      expect(mockStore.set).toHaveBeenCalledTimes(1);
    });

    test('WHEN setAuthToken is called with token and expiry THEN it sets both token and expiry', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const token = 'test-token';
      const expiry = Date.now() + 3600000;

      // Act
      authStorage.setAuthToken(token, expiry);

      // Assert
      expect(mockStore.set).toHaveBeenCalledWith('authToken', token);
      expect(mockStore.set).toHaveBeenCalledWith('tokenExpiry', expiry);
      expect(mockStore.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAuthToken', () => {
    test('WHEN getAuthToken is called and token exists without expiry THEN it returns token', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const token = 'test-token';
      mockStore.get.mockReturnValueOnce(token).mockReturnValueOnce(null);

      // Act
      const result = authStorage.getAuthToken();

      // Assert
      expect(result).toBe(token);
      expect(mockStore.get).toHaveBeenCalledWith('authToken');
      expect(mockStore.get).toHaveBeenCalledWith('tokenExpiry');
    });

    test('WHEN getAuthToken is called and token is valid THEN it returns token', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const token = 'test-token';
      const futureExpiry = Date.now() + 3600000;
      mockStore.get
        .mockReturnValueOnce(token)
        .mockReturnValueOnce(futureExpiry);

      // Act
      const result = authStorage.getAuthToken();

      // Assert
      expect(result).toBe(token);
      expect(mockStore.delete).not.toHaveBeenCalled();
    });

    test('WHEN getAuthToken is called and token is expired THEN it clears token and returns null', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const token = 'test-token';
      const pastExpiry = Date.now() - 3600000;
      mockStore.get.mockReturnValueOnce(token).mockReturnValueOnce(pastExpiry);

      // Act
      const result = authStorage.getAuthToken();

      // Assert
      expect(result).toBeNull();
      expect(mockStore.delete).toHaveBeenCalledWith('authToken');
      expect(mockStore.delete).toHaveBeenCalledWith('tokenExpiry');
    });

    test('WHEN getAuthToken is called and no token exists THEN it returns null', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      mockStore.get.mockReturnValue(null);

      // Act
      const result = authStorage.getAuthToken();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clearAuthToken', () => {
    test('WHEN clearAuthToken is called THEN it deletes both token and expiry', () => {
      const { mockStore, authStorage } = createMockAuthStorage();

      // Act
      authStorage.clearAuthToken();

      // Assert
      expect(mockStore.delete).toHaveBeenCalledWith('authToken');
      expect(mockStore.delete).toHaveBeenCalledWith('tokenExpiry');
      expect(mockStore.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('isAuthenticated', () => {
    test('WHEN isAuthenticated is called and token exists THEN it returns true', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      mockStore.get.mockReturnValueOnce('test-token').mockReturnValueOnce(null);

      // Act
      const result = authStorage.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });

    test('WHEN isAuthenticated is called and no token exists THEN it returns false', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      mockStore.get.mockReturnValue(null);

      // Act
      const result = authStorage.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });

    test('WHEN isAuthenticated is called and token is expired THEN it returns false', () => {
      const { mockStore, authStorage } = createMockAuthStorage();
      const pastExpiry = Date.now() - 3600000;
      mockStore.get
        .mockReturnValueOnce('test-token')
        .mockReturnValueOnce(pastExpiry);

      // Act
      const result = authStorage.isAuthenticated();

      // Assert
      expect(result).toBe(false);
    });
  });
});

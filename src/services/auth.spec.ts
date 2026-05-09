/* eslint-disable @typescript-eslint/unbound-method */
import { API_ENDPOINTS, type AuthenticatedUser, SubscriptionLevel } from '../../shared/api';
import { authService } from './auth';

jest.mock('../config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

jest.mock('axios');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const axios = require('axios') as jest.Mocked<typeof import('axios').default>;

function createUser(): AuthenticatedUser {
  return {
    user: { email: 'a@b' },
    subscription: {
      active_from: '2024-01-01T00:00:00Z',
      active_to: null,
      level: SubscriptionLevel.PRO,
    },
    settings: {
      solutionLanguage: 'python' as AuthenticatedUser['settings']['solutionLanguage'],
      userLanguage: 'en-US' as AuthenticatedUser['settings']['userLanguage'],
    },
  };
}

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.electronAPI = {
      ...window.electronAPI,
      authSetToken: jest.fn().mockResolvedValue({ success: true }),
      authClearToken: jest.fn().mockResolvedValue({ success: true }),
      authGetToken: jest.fn().mockResolvedValue({ success: true, token: 'tok' }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  describe('login', () => {
    test('WHEN login is called THEN it posts credentials and returns response data', async () => {
      const responseData = { data: { user: { email: 'a@b' }, session: null }, error: null };
      axios.post.mockResolvedValueOnce({ data: responseData });

      // Act
      const result = await authService.login('a@b', 'pw');

      // Assert
      expect(result).toEqual(responseData);
      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:3000${API_ENDPOINTS.AUTH.LOGIN}`,
        { email: 'a@b', password: 'pw' },
        { timeout: 15000 },
      );
    });
  });

  describe('signUp', () => {
    test('WHEN signUp is called THEN it forwards data and error from response', async () => {
      const apiResponse = {
        data: { user: { email: 'a@b' }, session: null },
        error: null,
      };
      axios.post.mockResolvedValueOnce({ data: apiResponse });

      // Act
      const result = await authService.signUp('a@b', 'pw');

      // Assert
      expect(result).toEqual(apiResponse);
    });
  });

  describe('getCurrentUser', () => {
    test('WHEN no token is available THEN it returns null without calling API', async () => {
      (window.electronAPI.authGetToken as jest.Mock).mockResolvedValueOnce({
        success: true,
        token: null,
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    test('WHEN token exists THEN it returns the user from API', async () => {
      const user = createUser();
      axios.get.mockResolvedValueOnce({ data: user });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toEqual(user);
      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:3000${API_ENDPOINTS.AUTH.USER}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer tok' },
          timeout: 15000,
        }),
      );
    });

    test('WHEN API call rejects THEN it returns null', async () => {
      axios.get.mockRejectedValueOnce(new Error('boom'));

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAuthToken', () => {
    test('WHEN electronAPI returns token THEN it returns the token', async () => {
      // Act
      const token = await authService.getAuthToken();

      // Assert
      expect(token).toBe('tok');
    });

    test('WHEN electronAPI returns no token THEN it returns null', async () => {
      (window.electronAPI.authGetToken as jest.Mock).mockResolvedValueOnce({
        success: true,
        token: undefined,
      });

      // Act
      const token = await authService.getAuthToken();

      // Assert
      expect(token).toBeNull();
    });

    test('WHEN electronAPI throws THEN it returns null', async () => {
      (window.electronAPI.authGetToken as jest.Mock).mockRejectedValueOnce(new Error('ipc fail'));

      // Act
      const token = await authService.getAuthToken();

      // Assert
      expect(token).toBeNull();
    });
  });

  describe('clearAuthToken', () => {
    test('WHEN clearAuthToken is called THEN it invokes electronAPI.authClearToken', async () => {
      // Act
      await authService.clearAuthToken();

      // Assert
      expect(window.electronAPI.authClearToken).toHaveBeenCalled();
    });
  });
});

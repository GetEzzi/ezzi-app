import { API_ENDPOINTS, ProgrammingLanguage, UserLanguage } from '../../shared/api';
import { authService } from './auth';
import { settingsService } from './settings';

jest.mock('../../shared/constants', () => ({
  API_BASE_URL: 'http://localhost:3000',
  isSelfHosted: jest.fn(() => false),
}));

jest.mock('./auth', () => ({
  authService: {
    getAuthToken: jest.fn(),
  },
}));

jest.mock('axios');

const axios = require('axios') as jest.Mocked<typeof import('axios').default>;

describe('settingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    test('WHEN no token is available THEN it throws an error', async () => {
      (authService.getAuthToken as jest.Mock).mockResolvedValueOnce(null);

      // Act
      const call = settingsService.getSettings();

      // Assert
      await expect(call).rejects.toThrow('No authentication token available');
    });

    test('WHEN token is present THEN it sends Authorization header and returns data', async () => {
      const data = {
        solutionLanguage: ProgrammingLanguage.Python,
        userLanguage: UserLanguage.EN_US,
      };
      (authService.getAuthToken as jest.Mock).mockResolvedValueOnce('tok');
      axios.get.mockResolvedValueOnce({ data });

      // Act
      const result = await settingsService.getSettings();

      // Assert
      expect(result).toEqual(data);
      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:3000${API_ENDPOINTS.SETTINGS.GET}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer tok' },
        }),
      );
    });
  });

  describe('updateSettings', () => {
    test('WHEN no token is available THEN it throws an error', async () => {
      (authService.getAuthToken as jest.Mock).mockResolvedValueOnce(null);

      // Act
      const call = settingsService.updateSettings({
        solutionLanguage: ProgrammingLanguage.Python,
        userLanguage: UserLanguage.EN_US,
      });

      // Assert
      await expect(call).rejects.toThrow('No authentication token available');
    });

    test('WHEN token is present THEN it posts settings with Authorization header', async () => {
      (authService.getAuthToken as jest.Mock).mockResolvedValueOnce('tok');
      axios.post.mockResolvedValueOnce({ data: undefined });
      const payload = {
        solutionLanguage: ProgrammingLanguage.JavaScript,
        userLanguage: UserLanguage.ES_ES,
      };

      // Act
      await settingsService.updateSettings(payload);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        `http://localhost:3000${API_ENDPOINTS.SETTINGS.UPDATE}`,
        payload,
        expect.objectContaining({
          headers: { Authorization: 'Bearer tok' },
        }),
      );
    });
  });
});

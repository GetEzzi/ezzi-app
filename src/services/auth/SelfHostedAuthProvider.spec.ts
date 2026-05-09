import { AppMode, ProgrammingLanguage, SubscriptionLevel, UserLanguage } from '../../../shared/api';
import { getStorageProvider } from '../storage';
import { SelfHostedAuthProvider } from './SelfHostedAuthProvider';

jest.mock('../storage', () => ({
  getStorageProvider: jest.fn(),
}));

describe('SelfHostedAuthProvider', () => {
  let provider: SelfHostedAuthProvider;
  let mockStorage: { getSettings: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new SelfHostedAuthProvider();
    mockStorage = {
      getSettings: jest.fn().mockResolvedValue({
        solutionLanguage: ProgrammingLanguage.JavaScript,
        userLanguage: UserLanguage.ES_ES,
        appMode: AppMode.LIVE_INTERVIEW,
      }),
    };
    (getStorageProvider as jest.Mock).mockReturnValue(mockStorage);
  });

  describe('login', () => {
    test('WHEN login is called THEN it returns a fixed self-hosted session', async () => {
      // Act
      const response = await provider.login('any@user', 'pw');

      // Assert
      expect(response).toEqual({
        data: {
          user: { email: 'self-hosted@local' },
          session: { access_token: 'self-hosted-token' },
        },
        error: null,
      });
    });
  });

  describe('signUp', () => {
    test('WHEN signUp is called THEN it delegates to login', async () => {
      // Act
      const response = await provider.signUp('a@b', 'pw');

      // Assert
      expect(response.data.session?.access_token).toBe('self-hosted-token');
    });
  });

  describe('getCurrentUser', () => {
    test('WHEN getCurrentUser is called THEN it returns PRO mock user with stored settings', async () => {
      // Act
      const user = await provider.getCurrentUser();

      // Assert
      expect(user).toEqual({
        user: { email: 'self-hosted@local' },
        subscription: {
          active_from: expect.any(String),
          active_to: expect.any(String),
          level: SubscriptionLevel.PRO,
        },
        settings: {
          solutionLanguage: ProgrammingLanguage.JavaScript,
          userLanguage: UserLanguage.ES_ES,
        },
      });
    });
  });

  describe('getAuthToken', () => {
    test('WHEN getAuthToken is called THEN it returns self-hosted-token', async () => {
      // Act
      const token = await provider.getAuthToken();

      // Assert
      expect(token).toBe('self-hosted-token');
    });
  });

  describe('isAuthenticated', () => {
    test('WHEN isAuthenticated is called THEN it returns true', async () => {
      // Act
      const result = await provider.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });
  });
});

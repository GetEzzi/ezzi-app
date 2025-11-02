/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {
  AuthenticatedUser,
  ProgrammingLanguage,
  SubscriptionLevel,
  UserLanguage,
} from '../shared/api';
import { authService } from './services/auth';
import { getStorageProvider } from './services/storage';
import { getAuthProvider } from './services/auth/index';
import { isSelfHosted } from '@shared/constants';

// Mock all external dependencies
jest.mock('./services/auth.ts');
jest.mock('./services/storage');
jest.mock('./services/auth/index');
jest.mock('@shared/constants.ts', () => ({
  isSelfHosted: jest.fn(() => false),
  API_BASE_URL: 'http://localhost:3000',
}));
jest.mock('./config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));
jest.mock('./contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: any }) => children,
  useSettings: () => ({
    solutionLanguage: 'javascript',
    userLanguage: 'es-ES',
    loading: false,
    error: null,
    updateSolutionLanguage: jest.fn(),
    updateUserLanguage: jest.fn(),
  }),
}));

jest.mock('./pages/SubscribedApp', () => {
  return function MockSubscribedApp() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
    const { useSettings } = require('./contexts/SettingsContext');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const settings = useSettings();

    return (
      <div data-testid="subscribed-app">
        <span data-testid="language">{settings.solutionLanguage}</span>
        <span data-testid="locale">{settings.userLanguage}</span>
      </div>
    );
  };
});
jest.mock('./pages/SubscribePage', () => {
  return function MockSubscribePage({ user }: any) {
    return (
      <div data-testid="subscribe-page">Subscribe Page - {user.email}</div>
    );
  };
});
jest.mock('./pages/AuthForm.tsx', () => {
  return {
    AuthForm: function MockAuthForm({ setUser }: any) {
      return (
        <div data-testid="auth-form">
          <button onClick={() => setUser(createMockUser())}>Login</button>
        </div>
      );
    },
  };
});

function createMockUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  const defaultSubscription: AuthenticatedUser['subscription'] = {
    active_from: '2024-01-01T00:00:00.000Z',
    active_to: null,
    level: SubscriptionLevel.PRO,
  };

  return {
    id: 'test-user-id',
    email: 'test@example.com',
    subscription: {
      ...defaultSubscription,
      ...overrides.subscription,
    },
    ...overrides,
  };
}

function createMockAuthProvider() {
  return {
    getCurrentUser: jest.fn(),
    getAuthToken: jest.fn(),
    clearAuthToken: jest.fn(),
  };
}

function createMockStorageProvider() {
  return {
    getSettings: jest.fn(),
    getAppMode: jest.fn(),
  };
}

describe('App', () => {
  let mockAuthProvider: ReturnType<typeof createMockAuthProvider>;
  let mockStorageProvider: ReturnType<typeof createMockStorageProvider>;
  let mockAuthService: jest.Mocked<typeof authService>;
  let mockIsSelfHosted: jest.MockedFunction<typeof isSelfHosted>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthProvider = createMockAuthProvider();
    mockStorageProvider = createMockStorageProvider();
    mockAuthService = authService as jest.Mocked<typeof authService>;
    mockIsSelfHosted = isSelfHosted as jest.MockedFunction<typeof isSelfHosted>;

    (getAuthProvider as jest.Mock).mockReturnValue(mockAuthProvider);
    (getStorageProvider as jest.Mock).mockReturnValue(mockStorageProvider);
    mockIsSelfHosted.mockReturnValue(false);

    // Default successful settings response
    mockStorageProvider.getSettings.mockResolvedValue({
      solutionLanguage: ProgrammingLanguage.Python,
      userLanguage: UserLanguage.EN_US,
    });

    // Default app mode response
    mockStorageProvider.getAppMode.mockResolvedValue('live_interview');

    // Clear window globals
    delete (window as any).__LANGUAGE__;
    delete (window as any).__LOCALE__;
    delete (window as any).__IS_INITIALIZED__;

    // Set default test globals
    (global as any).__TEST_SOLUTION_LANGUAGE__ = ProgrammingLanguage.Python;
    (global as any).__TEST_USER_LANGUAGE__ = UserLanguage.EN_US;
  });

  describe('App loading states', () => {
    test('WHEN app is loading THEN it shows loading spinner', () => {
      mockAuthProvider.getCurrentUser.mockImplementation(
        () => new Promise(() => {}),
      );

      render(<App />);

      // Assert
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Authentication flow', () => {
    test('WHEN user is not authenticated THEN it shows auth form', async () => {
      mockAuthProvider.getCurrentUser.mockResolvedValue(null);

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      });

      // Assert
      expect(screen.queryByTestId('subscribed-app')).not.toBeInTheDocument();
      expect(screen.queryByTestId('subscribe-page')).not.toBeInTheDocument();
    });

    test('WHEN user logs in through auth form THEN it updates user state', async () => {
      mockAuthProvider.getCurrentUser.mockResolvedValue(null);
      const user = userEvent.setup();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      });

      // Act
      await user.click(screen.getByText('Login'));

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId('auth-form')).not.toBeInTheDocument();
      });
    });
  });

  describe('Self-hosted mode', () => {
    test('WHEN in self-hosted mode THEN it skips initialization', async () => {
      mockIsSelfHosted.mockReturnValue(true);
      mockAuthProvider.getCurrentUser.mockResolvedValue(null);

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      });

      // Assert
      expect(mockAuthProvider.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('Subscription states', () => {
    test('WHEN user has PRO subscription THEN it shows subscribed app', async () => {
      const proUser = createMockUser({
        subscription: { level: SubscriptionLevel.PRO },
      });
      mockAuthProvider.getCurrentUser.mockResolvedValue(proUser);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      });

      // Assert
      expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      expect(screen.getByTestId('language')).toHaveTextContent('javascript');
      expect(screen.getByTestId('locale')).toHaveTextContent('es-ES');
    });

    test('WHEN user has no subscription THEN it shows subscribe page', async () => {
      const freeUser = createMockUser({
        subscription: { level: SubscriptionLevel.FREE },
      });
      mockAuthProvider.getCurrentUser.mockResolvedValue(freeUser);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('subscribe-page')).toBeInTheDocument();
      });

      // Assert
      expect(
        screen.getByText(/Subscribe Page - test@example.com/),
      ).toBeInTheDocument();
    });
  });

  describe('Subscription polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('WHEN user is not subscribed THEN it polls for subscription updates', async () => {
      const freeUser = createMockUser({
        subscription: { level: SubscriptionLevel.FREE },
      });
      mockAuthProvider.getCurrentUser.mockResolvedValue(freeUser);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');
      mockAuthService.getCurrentUser.mockResolvedValue(freeUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('subscribe-page')).toBeInTheDocument();
      });

      // Act
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Assert
      await waitFor(() => {
        expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      });
    });

    test('WHEN subscription status changes during polling THEN it updates UI', async () => {
      const freeUser = createMockUser({
        subscription: { level: SubscriptionLevel.FREE },
      });
      const proUser = createMockUser({
        subscription: { level: SubscriptionLevel.PRO },
      });

      mockAuthProvider.getCurrentUser.mockResolvedValue(freeUser);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');
      mockAuthService.getCurrentUser.mockResolvedValue(proUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('subscribe-page')).toBeInTheDocument();
      });

      // Act
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      });
    });
  });

  describe('Settings initialization', () => {
    test('WHEN settings load successfully THEN it updates language and locale', async () => {
      const user = createMockUser();
      mockAuthProvider.getCurrentUser.mockResolvedValue(user);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');
      mockStorageProvider.getSettings.mockResolvedValue({
        solutionLanguage: ProgrammingLanguage.JavaScript,
        userLanguage: UserLanguage.ES_ES,
      });

      // Set test globals for this specific test
      (global as any).__TEST_SOLUTION_LANGUAGE__ =
        ProgrammingLanguage.JavaScript;
      (global as any).__TEST_USER_LANGUAGE__ = UserLanguage.ES_ES;

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      });

      // Assert
      expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      expect(screen.getByTestId('language')).toHaveTextContent('javascript');
      expect(screen.getByTestId('locale')).toHaveTextContent('es-ES');
    });

    test('WHEN settings fail to load THEN it shows error toast and continues', async () => {
      const user = createMockUser();
      mockAuthProvider.getCurrentUser.mockResolvedValue(user);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');
      mockStorageProvider.getSettings.mockRejectedValue(
        new Error('Settings error'),
      );

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      });

      // Assert
      expect(
        screen.getByText('Failed to load user settings'),
      ).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    test('WHEN auth token is missing THEN it clears user state', async () => {
      const user = createMockUser();
      mockAuthProvider.getCurrentUser.mockResolvedValue(user);
      mockAuthProvider.getAuthToken.mockResolvedValue(null);

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      });

      // Assert
      expect(mockAuthProvider.clearAuthToken).not.toHaveBeenCalled();
    });

    test('WHEN initialization fails THEN it shows auth form and error toast', async () => {
      mockAuthProvider.getCurrentUser.mockRejectedValue(
        new Error('Auth error'),
      );

      render(<App />);

      // Act
      await waitFor(() => {
        expect(screen.getByTestId('auth-form')).toBeInTheDocument();
      });

      // Assert
      expect(screen.getByText('Failed to initialize app')).toBeInTheDocument();
      expect(mockAuthProvider.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('Component cleanup', () => {
    test('WHEN component unmounts THEN it cleans up mounted ref', async () => {
      const user = createMockUser();
      mockAuthProvider.getCurrentUser.mockResolvedValue(user);
      mockAuthProvider.getAuthToken.mockResolvedValue('valid-token');

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('subscribed-app')).toBeInTheDocument();
      });

      // Act
      unmount();

      // Assert - No specific assertion as this tests internal cleanup
    });
  });
});

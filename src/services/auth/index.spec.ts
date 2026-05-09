jest.mock('../../../shared/constants', () => ({
  isSelfHosted: jest.fn(() => false),
  API_BASE_URL: 'http://localhost:3000',
}));

jest.mock('../auth', () => ({
  authService: {},
}));

jest.mock('../storage', () => ({
  getStorageProvider: jest.fn(),
}));

function loadProvider(selfHosted: boolean): { provider: unknown; ctorName: string } {
  let provider: unknown;
  let ctorName = '';
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const constants = require('../../../shared/constants') as { isSelfHosted: jest.Mock };
    constants.isSelfHosted.mockReturnValue(selfHosted);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const moduleUnderTest = require('./index') as typeof import('./index');
    provider = moduleUnderTest.getAuthProvider();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ctorName = (provider as any).constructor.name as string;
  });

  return { provider, ctorName };
}

describe('auth/getAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mode selection', () => {
    test('WHEN self-hosted is true THEN it returns SelfHostedAuthProvider', () => {
      // Act
      const { ctorName } = loadProvider(true);

      // Assert
      expect(ctorName).toBe('SelfHostedAuthProvider');
    });

    test('WHEN self-hosted is false THEN it returns ApiAuthProvider', () => {
      // Act
      const { ctorName } = loadProvider(false);

      // Assert
      expect(ctorName).toBe('ApiAuthProvider');
    });
  });

  describe('memoization', () => {
    test('WHEN called twice THEN it returns the same instance', () => {
      let a: unknown;
      let b: unknown;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const moduleUnderTest = require('./index') as typeof import('./index');
        a = moduleUnderTest.getAuthProvider();
        b = moduleUnderTest.getAuthProvider();
      });

      // Assert
      expect(a).toBe(b);
    });
  });
});

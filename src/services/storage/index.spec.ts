import { SubscriptionLevel } from '../../../shared/api';
import { isSelfHosted } from '../../../shared/constants';
import { ApiStorageProvider } from './ApiStorageProvider';
import { getStorageProvider, resetStorageProvider } from './index';
import { LocalStorageProvider } from './LocalStorageProvider';

jest.mock('../../../shared/constants', () => ({
  isSelfHosted: jest.fn(() => false),
  API_BASE_URL: 'http://localhost:3000',
}));

describe('storage/getStorageProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStorageProvider();
    (isSelfHosted as jest.MockedFunction<typeof isSelfHosted>).mockReturnValue(false);
  });

  describe('mode selection', () => {
    test('WHEN self-hosted mode is on THEN it returns LocalStorageProvider', () => {
      (isSelfHosted as jest.MockedFunction<typeof isSelfHosted>).mockReturnValue(true);

      // Act
      const provider = getStorageProvider();

      // Assert
      expect(provider).toBeInstanceOf(LocalStorageProvider);
    });

    test('WHEN subscription is FREE THEN it returns LocalStorageProvider', () => {
      // Act
      const provider = getStorageProvider(SubscriptionLevel.FREE);

      // Assert
      expect(provider).toBeInstanceOf(LocalStorageProvider);
    });

    test('WHEN subscription is PRO THEN it returns ApiStorageProvider', () => {
      // Act
      const provider = getStorageProvider(SubscriptionLevel.PRO);

      // Assert
      expect(provider).toBeInstanceOf(ApiStorageProvider);
    });

    test('WHEN subscription level changes THEN provider is recreated', () => {
      const free = getStorageProvider(SubscriptionLevel.FREE);

      // Act
      const pro = getStorageProvider(SubscriptionLevel.PRO);

      // Assert
      expect(free).not.toBe(pro);
      expect(pro).toBeInstanceOf(ApiStorageProvider);
    });
  });

  describe('memoization', () => {
    test('WHEN called twice with same level THEN it returns the same instance', () => {
      const a = getStorageProvider(SubscriptionLevel.PRO);

      // Act
      const b = getStorageProvider(SubscriptionLevel.PRO);

      // Assert
      expect(a).toBe(b);
    });

    test('WHEN resetStorageProvider is called THEN next call rebuilds provider', () => {
      const a = getStorageProvider(SubscriptionLevel.PRO);

      // Act
      resetStorageProvider();
      const b = getStorageProvider(SubscriptionLevel.PRO);

      // Assert
      expect(a).not.toBe(b);
    });
  });
});

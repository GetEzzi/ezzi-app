/* eslint-disable @typescript-eslint/unbound-method */
import axios from 'axios';
import type { ProcessingParams } from './AppModeProcessor';
import { LeetCodeProcessor } from './LeetCodeProcessor';

jest.mock('axios');
jest.mock('../../shared/constants', () => ({
  API_BASE_URL: 'http://localhost:3000',
  isSelfHosted: jest.fn(() => false),
}));

function createParams(overrides: Partial<ProcessingParams> = {}): ProcessingParams {
  return {
    images: ['data:image/png;base64,xxx'],
    isMock: false,
    readableVarNames: false,
    signal: new AbortController().signal,
    headers: { 'Content-Type': 'application/json' },
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedAxios = axios as unknown as jest.Mocked<any>;
const mockedIsCancel = jest.fn();

describe('LeetCodeProcessor', () => {
  let processor: LeetCodeProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new LeetCodeProcessor();
    mockedIsCancel.mockReturnValue(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (axios as unknown as { isCancel: jest.Mock }).isCancel = mockedIsCancel;
  });

  describe('processSolve', () => {
    test('WHEN request succeeds THEN it returns success with data', async () => {
      const data = { code: 'class Solution {}', conversationId: 'c1' };
      mockedAxios.post.mockResolvedValueOnce({ data });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({ success: true, data });
    });

    test('WHEN response is 401 THEN it returns session expired error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result.error).toBe('Your session or subscription has expired. Please sign in again.');
    });

    test('WHEN response is 402 THEN it returns upgrade error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 402 } });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result.error).toBe(
        'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
      );
    });

    test('WHEN request is cancelled THEN it returns cancelled error', async () => {
      mockedIsCancel.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(new Error('cancelled'));

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result.error).toBe('Processing was canceled by the user.');
    });
  });

  describe('processDebug', () => {
    test('WHEN conversationId is missing THEN it short-circuits with helpful error', async () => {
      // Act
      const result = await processor.processDebug(createParams());

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Conversation ID is required for debug requests. Please solve a problem first.',
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('WHEN conversationId is provided and request succeeds THEN it returns data', async () => {
      const data = { code: 'fixed', conversationId: 'c1' };
      mockedAxios.post.mockResolvedValueOnce({ data });

      // Act
      const result = await processor.processDebug(createParams({ conversationId: 'c1' }));

      // Assert
      expect(result).toEqual({ success: true, data });
    });

    test('WHEN response is 401 THEN it returns session expired error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

      // Act
      const result = await processor.processDebug(createParams({ conversationId: 'c1' }));

      // Assert
      expect(result.error).toBe('Your session or subscription has expired. Please sign in again.');
    });

    test('WHEN response is 402 THEN it returns upgrade error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 402 } });

      // Act
      const result = await processor.processDebug(createParams({ conversationId: 'c1' }));

      // Assert
      expect(result.error).toBe(
        'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
      );
    });

    test('WHEN request is cancelled THEN it returns cancelled error', async () => {
      mockedIsCancel.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(new Error('cancelled'));

      // Act
      const result = await processor.processDebug(createParams({ conversationId: 'c1' }));

      // Assert
      expect(result.error).toBe('Processing was canceled by the user.');
    });
  });
});

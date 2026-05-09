import axios from 'axios';
import type { ProcessingParams } from './AppModeProcessor';
import { LiveInterviewProcessor } from './LiveInterviewProcessor';

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

const mockedAxios = axios as unknown as jest.Mocked<any>;
const mockedIsCancel = jest.fn();

describe('LiveInterviewProcessor', () => {
  let processor: LiveInterviewProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new LiveInterviewProcessor();
    mockedIsCancel.mockReturnValue(false);
    (axios as unknown as { isCancel: jest.Mock }).isCancel = mockedIsCancel;
  });

  describe('processSolve', () => {
    test('WHEN request succeeds THEN it returns success with data', async () => {
      const data = {
        thoughts: ['t1'],
        code: 'print("hi")',
        time_complexity: 'O(1)',
        space_complexity: 'O(1)',
        problem_statement: 'p',
        conversationId: 'c1',
      };
      mockedAxios.post.mockResolvedValueOnce({ data });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({ success: true, data });
    });

    test('WHEN request is cancelled THEN it returns cancelled error', async () => {
      const cancelError = new Error('cancelled');
      mockedIsCancel.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(cancelError);

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Processing was canceled by the user.',
      });
    });

    test('WHEN response is 401 THEN it returns session expired error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Your session or subscription has expired. Please sign in again.',
      });
    });

    test('WHEN response is 402 THEN it returns upgrade error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 402 } });

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
      });
    });

    test('WHEN error is generic Error THEN it returns its message', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('network down'));

      // Act
      const result = await processor.processSolve(createParams());

      // Assert
      expect(result).toEqual({ success: false, error: 'network down' });
    });
  });

  describe('processDebug', () => {
    test('WHEN request succeeds THEN it returns success with data', async () => {
      const data = {
        code: 'fixed',
        thoughts: ['t'],
        time_complexity: 'O(n)',
        space_complexity: 'O(n)',
        conversationId: 'c2',
      };
      mockedAxios.post.mockResolvedValueOnce({ data });

      // Act
      const result = await processor.processDebug(createParams());

      // Assert
      expect(result).toEqual({ success: true, data });
    });

    test('WHEN response is 401 THEN it returns session expired error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

      // Act
      const result = await processor.processDebug(createParams());

      // Assert
      expect(result.error).toBe('Your session or subscription has expired. Please sign in again.');
    });

    test('WHEN response is 402 THEN it returns upgrade error', async () => {
      mockedAxios.post.mockRejectedValueOnce({ response: { status: 402 } });

      // Act
      const result = await processor.processDebug(createParams());

      // Assert
      expect(result.error).toBe(
        'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
      );
    });

    test('WHEN request is cancelled THEN it returns cancelled error', async () => {
      mockedIsCancel.mockReturnValueOnce(true);
      mockedAxios.post.mockRejectedValueOnce(new Error('cancelled'));

      // Act
      const result = await processor.processDebug(createParams());

      // Assert
      expect(result.error).toBe('Processing was canceled by the user.');
    });
  });
});

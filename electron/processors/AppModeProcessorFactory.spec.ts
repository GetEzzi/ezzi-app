import { AppMode } from '../../shared/api';
import type { AppModeProcessor } from './AppModeProcessor';
import { AppModeProcessorFactory } from './AppModeProcessorFactory';
import { LeetCodeProcessor } from './LeetCodeProcessor';
import { LiveInterviewProcessor } from './LiveInterviewProcessor';

jest.mock('../../shared/constants', () => ({
  API_BASE_URL: 'http://localhost:3000',
  isSelfHosted: jest.fn(() => false),
}));

function createFactory(): AppModeProcessorFactory {
  (AppModeProcessorFactory as any).instance = null;

  return AppModeProcessorFactory.getInstance();
}

describe('AppModeProcessorFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppModeProcessorFactory as any).instance = null;
  });

  describe('getInstance', () => {
    test('WHEN getInstance is called twice THEN it returns the same singleton', () => {
      const a = AppModeProcessorFactory.getInstance();
      const b = AppModeProcessorFactory.getInstance();

      // Assert
      expect(a).toBe(b);
    });
  });

  describe('getProcessor', () => {
    test('WHEN appMode is LIVE_INTERVIEW THEN it returns LiveInterviewProcessor', () => {
      const factory = createFactory();

      // Act
      const processor = factory.getProcessor(AppMode.LIVE_INTERVIEW);

      // Assert
      expect(processor).toBeInstanceOf(LiveInterviewProcessor);
    });

    test('WHEN appMode is LEETCODE_SOLVER THEN it returns LeetCodeProcessor', () => {
      const factory = createFactory();

      // Act
      const processor = factory.getProcessor(AppMode.LEETCODE_SOLVER);

      // Assert
      expect(processor).toBeInstanceOf(LeetCodeProcessor);
    });

    test('WHEN appMode is unknown THEN it falls back to LiveInterviewProcessor', () => {
      const factory = createFactory();

      // Act
      const processor = factory.getProcessor('unknown-mode' as AppMode);

      // Assert
      expect(processor).toBeInstanceOf(LiveInterviewProcessor);
    });
  });

  describe('registerProcessor', () => {
    test('WHEN a custom processor is registered THEN getProcessor returns it', () => {
      const factory = createFactory();
      const customProcessor: AppModeProcessor = {
        processSolve: jest.fn(),
        processDebug: jest.fn(),
      };

      // Act
      factory.registerProcessor(AppMode.LEETCODE_SOLVER, customProcessor);
      const result = factory.getProcessor(AppMode.LEETCODE_SOLVER);

      // Assert
      expect(result).toBe(customProcessor);
    });
  });
});

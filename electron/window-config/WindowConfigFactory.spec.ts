import { AppMode } from '../../shared/api';
import { LeetCodeSolverConfig } from './configs/LeetCodeSolverConfig';
import { LiveInterviewConfig } from './configs/LiveInterviewConfig';
import { WindowConfigFactory } from './WindowConfigFactory';

describe('WindowConfigFactory', () => {
  beforeEach(() => {
    (WindowConfigFactory as any).instance = null;
  });

  describe('getInstance', () => {
    test('WHEN getInstance is called twice THEN it returns the same singleton', () => {
      const a = WindowConfigFactory.getInstance();
      const b = WindowConfigFactory.getInstance();

      // Assert
      expect(a).toBe(b);
    });
  });

  describe('getConfig', () => {
    test('WHEN appMode is LIVE_INTERVIEW THEN it returns LiveInterviewConfig', () => {
      const factory = WindowConfigFactory.getInstance();

      // Act
      const config = factory.getConfig(AppMode.LIVE_INTERVIEW);

      // Assert
      expect(config).toBe(LiveInterviewConfig);
    });

    test('WHEN appMode is LEETCODE_SOLVER THEN it returns LeetCodeSolverConfig', () => {
      const factory = WindowConfigFactory.getInstance();

      // Act
      const config = factory.getConfig(AppMode.LEETCODE_SOLVER);

      // Assert
      expect(config).toBe(LeetCodeSolverConfig);
    });

    test('WHEN appMode is unknown THEN it falls back to LiveInterviewConfig', () => {
      const factory = WindowConfigFactory.getInstance();

      // Act
      const config = factory.getConfig('mystery' as AppMode);

      // Assert
      expect(config).toBe(LiveInterviewConfig);
    });
  });
});

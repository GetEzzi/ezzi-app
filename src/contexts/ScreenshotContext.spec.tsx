import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Screenshot } from '../../shared/api';
import { ScreenshotProvider, useScreenshotContext } from './ScreenshotContext';

function wrapper({ children }: { children: ReactNode }) {
  return <ScreenshotProvider>{children}</ScreenshotProvider>;
}

const sample: Screenshot = { path: '/tmp/a.png', preview: 'data:image/png;base64,xxx' };

describe('ScreenshotContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.electronAPI = {
      ...window.electronAPI,
      clearAllScreenshots: jest.fn().mockResolvedValue({ success: true }),
    } as any;
  });

  describe('setScreenshots', () => {
    test('WHEN setScreenshots is called THEN state.screenshots reflects the payload', () => {
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });

      // Act
      act(() => {
        result.current.setScreenshots([sample]);
      });

      // Assert
      expect(result.current.state.screenshots).toEqual([sample]);
    });
  });

  describe('clearScreenshots', () => {
    test('WHEN clearScreenshots is called THEN it empties the queue', () => {
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });
      act(() => result.current.setScreenshots([sample]));

      // Act
      act(() => result.current.clearScreenshots());

      // Assert
      expect(result.current.state.screenshots).toEqual([]);
    });
  });

  describe('deleteScreenshot', () => {
    test('WHEN deleteScreenshot is called THEN target index is removed from list', () => {
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });
      const second: Screenshot = { path: '/tmp/b.png', preview: 'p' };
      act(() => result.current.setScreenshots([sample, second]));

      // Act
      act(() => result.current.deleteScreenshot(0));

      // Assert
      expect(result.current.state.screenshots).toEqual([second]);
    });
  });

  describe('clearAllScreenshots', () => {
    test('WHEN IPC succeeds THEN local list is emptied', async () => {
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });
      act(() => result.current.setScreenshots([sample]));

      // Act
      await act(async () => {
        await result.current.clearAllScreenshots();
      });

      // Assert
      expect(window.electronAPI.clearAllScreenshots).toHaveBeenCalled();
      expect(result.current.state.screenshots).toEqual([]);
    });

    test('WHEN IPC fails THEN local list is left intact', async () => {
      (window.electronAPI.clearAllScreenshots as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'fs busy',
      });
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });
      act(() => result.current.setScreenshots([sample]));

      // Act
      await act(async () => {
        await result.current.clearAllScreenshots();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state.screenshots).toEqual([sample]);
      });
    });
  });

  describe('setLoading', () => {
    test('WHEN setLoading toggles THEN state.loading reflects the value', () => {
      const { result } = renderHook(() => useScreenshotContext(), { wrapper });

      // Act
      act(() => result.current.setLoading(true));

      // Assert
      expect(result.current.state.loading).toBe(true);
    });
  });
});

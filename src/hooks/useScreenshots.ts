import { useEffect, useCallback } from 'react';
import { Screenshot } from '@shared/api.ts';
import { useScreenshotContext } from '../contexts/ScreenshotContext';

export function useScreenshots() {
  const {
    state,
    setScreenshots,
    clearScreenshots,
    clearAllScreenshots,
    setLoading,
  } = useScreenshotContext();

  const fetchScreenshots = useCallback(async () => {
    try {
      setLoading(true);
      const existing = await window.electronAPI.getScreenshots();
      const formattedScreenshots = (
        Array.isArray(existing) ? existing : []
      ).map((p) => ({
        id: p.path,
        path: p.path,
        preview: p.preview,
        timestamp: Date.now(),
      }));
      setScreenshots(formattedScreenshots);
    } catch (error) {
      console.error('Error loading screenshots:', error);
      setScreenshots([]);
    } finally {
      setLoading(false);
    }
  }, [setScreenshots, setLoading]);

  const handleDeleteScreenshot = async (index: number): Promise<boolean> => {
    const screenshotToDelete = state.screenshots[index];

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path,
      );

      if (response.success) {
        await fetchScreenshots();

        return true;
      } else {
        console.error('Failed to delete screenshot:', response.error);

        return false;
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error);

      return false;
    }
  };

  useEffect(() => {
    void fetchScreenshots();
  }, [fetchScreenshots]);

  return {
    screenshots: state.screenshots,
    loading: state.loading,
    refetch: fetchScreenshots,
    handleDeleteScreenshot,
    clearScreenshots,
    clearAllScreenshots,
  };
}

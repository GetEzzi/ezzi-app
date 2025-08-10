import { useState, useEffect, useCallback } from 'react';
import { Screenshot } from '@shared/api.ts';

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const handleDeleteScreenshot = async (index: number): Promise<boolean> => {
    const screenshotToDelete = screenshots[index];

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

  const clearScreenshots = useCallback(() => {
    setScreenshots([]);
  }, []);

  useEffect(() => {
    void fetchScreenshots();
  }, [fetchScreenshots]);

  return {
    screenshots,
    loading,
    refetch: fetchScreenshots,
    handleDeleteScreenshot,
    clearScreenshots,
  };
}

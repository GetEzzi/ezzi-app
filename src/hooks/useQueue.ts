import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/toast';
import { sendToElectron } from '../utils/electron';
import { IPC_EVENTS } from '@shared/constants.ts';
import { useScreenshots } from './useScreenshots';
import { useScreenshotEvents } from './useScreenshotEvents';

export function useQueue() {
  const { showToast } = useToast();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0
  });
  const isInitializedRef = useRef(false);

  const {
    screenshots,
    refetch,
    handleDeleteScreenshot: deleteScreenshot,
  } = useScreenshots();

  const handleDeleteScreenshot = async (index: number) => {
    const success = await deleteScreenshot(index);
    if (!success) {
      showToast('Error', 'Failed to delete the screenshot file', 'error');
    }
  };

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible);
    setTooltipHeight(height);
  };

  const updateDimensions = useCallback(() => {
    if (!contentRef.current) return;

    let contentHeight = contentRef.current.scrollHeight;
    const contentWidth = contentRef.current.scrollWidth;

    if (isTooltipVisible) {
      contentHeight += tooltipHeight;
    }

    // For the first update, always apply it
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastDimensionsRef.current = { width: contentWidth, height: contentHeight };

      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useQueue',
        })
        .catch(console.error);
      return;

    }

    // For subsequent updates, only update if dimensions have changed significantly
    const hasSignificantChange =
      Math.abs(lastDimensionsRef.current.width - contentWidth) > 10 ||
      Math.abs(lastDimensionsRef.current.height - contentHeight) > 10;

    if (hasSignificantChange) {
      lastDimensionsRef.current = { width: contentWidth, height: contentHeight };

      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useQueue',
        })
        .catch(console.error);
    }
  }, [isTooltipVisible, tooltipHeight]);

  const debouncedUpdateDimensions = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      updateDimensions();
    }, 200); // 200ms debounce for smoother experience
  }, [updateDimensions]);

  useScreenshotEvents({ refetch });

  // Main effect for resize observation and event listeners
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateDimensions();
    });
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    const cleanupFunctions = [
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          'Processing Failed',
          'There was an error processing your screenshots.',
          'error',
        );
        console.error('Processing error:', error);
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          'No Screenshots',
          'There are no screenshots to process.',
          'neutral',
        );
      }),
    ];

    // Initial dimension update after a small delay to ensure DOM is ready
    const initialUpdateTimer = setTimeout(() => {
      updateDimensions();
    }, 100);

    return () => {
      clearTimeout(initialUpdateTimer);
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [showToast, debouncedUpdateDimensions, updateDimensions]);

  useEffect(() => {
    if (screenshots.length === 0) {
      sendToElectron(IPC_EVENTS.QUEUE.LOADED_NO_SCREENSHOTS);
    } else {
      sendToElectron(
        IPC_EVENTS.QUEUE.LOADED_WITH_SCREENSHOTS,
        screenshots.length,
      );
    }
  }, [screenshots]);

  return {
    screenshots,
    refetch,
    handleDeleteScreenshot,
    handleTooltipVisibilityChange,
    contentRef,
    isTooltipVisible,
    tooltipHeight,
  };
}

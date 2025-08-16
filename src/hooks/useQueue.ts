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
    if (contentRef.current) {
      let contentHeight = contentRef.current.scrollHeight;
      const contentWidth = contentRef.current.scrollWidth;
      if (isTooltipVisible) {
        contentHeight += tooltipHeight;
      }
      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useQueue',
        })
        .catch(console.error);
    }
  }, [isTooltipVisible, tooltipHeight]);

  useScreenshotEvents({ refetch });

  // Separate effect for resize observation and event listeners (doesn't depend on tooltip state)
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
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

    return () => {
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [showToast, updateDimensions]);

  // Separate effect for tooltip-triggered dimension updates
  useEffect(() => {
    updateDimensions();
  }, [isTooltipVisible, tooltipHeight, updateDimensions]);

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

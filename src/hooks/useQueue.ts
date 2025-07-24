import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../contexts/toast';
import { Screenshot } from '../../shared/api';
import { sendToElectron } from '../utils/electron';
import { IPC_EVENTS } from '@shared/constants.ts';

async function fetchScreenshots() {
  try {
    return await window.electronAPI.getScreenshots();
  } catch (error) {
    console.error('Error loading screenshots:', error);

    throw error;
  }
}

export function useQueue() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: screenshots = [], refetch } = useQuery<Screenshot[]>({
    queryKey: ['screenshots'],
    queryFn: fetchScreenshots,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const handleDeleteScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index];

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path,
      );

      if (response.success) {
        await refetch();
      } else {
        console.error('Failed to delete screenshot:', response.error);
        showToast('Error', 'Failed to delete the screenshot file', 'error');
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  };

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible);
    setTooltipHeight(height);
  };

  const updateDimensions = () => {
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
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    updateDimensions();

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => {
        queryClient.removeQueries({
          queryKey: ['screenshots'],
        });
        refetch().catch(console.error);
      }),
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
  }, [isTooltipVisible, tooltipHeight, refetch, showToast, queryClient]);

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

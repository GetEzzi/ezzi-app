import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ScreenshotQueue from '../components/Queue/ScreenshotQueue';
import QueueCommands from '../components/Queue/QueueCommands';
import { useToast } from '../contexts/toast';
import {
  ProgrammingLanguage,
  Screenshot,
  UserLanguage,
} from '../../shared/api';
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

interface QueueProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  setLanguage: (language: ProgrammingLanguage) => void;
  setLocale: (language: UserLanguage) => void;
}

const Queue: React.FC<QueueProps> = ({
  setView,
  currentLanguage,
  currentLocale,
  setLanguage,
  setLocale,
}) => {
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
        await refetch(); // Refetch screenshots instead of managing state directly
      } else {
        console.error('Failed to delete screenshot:', response.error);
        showToast('Error', 'Failed to delete the screenshot file', 'error');
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  };

  useEffect(() => {
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

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    updateDimensions();

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(async () => {
        queryClient.removeQueries({
          queryKey: ['screenshots'],
        });
        await refetch();
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          'Processing Failed',
          'There was an error processing your screenshots.',
          'error',
        );
        setView('queue'); // Revert to queue if processing fails
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
  }, [isTooltipVisible, tooltipHeight]);

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible);
    setTooltipHeight(height);
  };

  // Log events when Queue page loads with or without screenshots
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

  return (
    <div ref={contentRef} className={`bg-transparent w-1/2`}>
      <div className="px-4 py-3">
        <div className="space-y-3 w-fit">
          <ScreenshotQueue
            isLoading={false}
            screenshots={screenshots}
            onDeleteScreenshot={handleDeleteScreenshot}
          />

          <QueueCommands
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
            screenshotCount={screenshots.length}
            currentLanguage={currentLanguage}
            currentLocale={currentLocale}
            setLanguage={setLanguage}
            setLocale={setLocale}
          />
        </div>
      </div>
    </div>
  );
};

export default Queue;

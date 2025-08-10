import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  DebugResponse,
  LeetCodeDebugResponse,
  Screenshot,
} from '@shared/api.ts';
import { useToast } from '../contexts/toast';

async function fetchScreenshots() {
  try {
    const existing = await window.electronAPI.getScreenshots();

    return (Array.isArray(existing) ? existing : []).map((p) => ({
      id: p.path,
      path: p.path,
      preview: p.preview,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error loading screenshots:', error);

    throw error;
  }
}

export function useDebug(
  isProcessing: boolean,
  setIsProcessing: (processing: boolean) => void,
) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: screenshots = [], refetch } = useQuery<Screenshot[]>({
    queryKey: ['screenshots'],
    queryFn: fetchScreenshots,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const [newCode, setNewCode] = useState<string | null>(null);
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null);
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null,
  );
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null,
  );

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
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error);
    }
  };

  const updateDimensions = () => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const contentWidth = contentRef.current.scrollWidth;

      window.electronAPI
        .updateContentDimensions({
          width: contentWidth,
          height: contentHeight,
          source: 'useDebug',
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    const newSolution = queryClient.getQueryData(['new_solution']) as
      | DebugResponse
      | LeetCodeDebugResponse;

    if (newSolution) {
      setNewCode(newSolution.code || null);
      setThoughtsData(
        'thoughts' in newSolution ? newSolution.thoughts || null : null,
      );
      setTimeComplexityData(
        'time_complexity' in newSolution
          ? newSolution.time_complexity || null
          : null,
      );
      setSpaceComplexityData(
        'space_complexity' in newSolution
          ? newSolution.space_complexity || null
          : null,
      );
      setIsProcessing(false);
    }

    const cleanupFunctions = [
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      window.electronAPI.onScreenshotTaken(() => refetch()),
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onDebugSuccess(() => setIsProcessing(false)),
      window.electronAPI.onDebugStart(() => setIsProcessing(true)),
      window.electronAPI.onDebugError((error: string) => {
        showToast(
          'Processing Failed',
          'There was an error debugging your code.',
          'error',
        );
        setIsProcessing(false);
        console.error('Processing error:', error);
      }),
    ];

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [queryClient, setIsProcessing, showToast, refetch]);

  return {
    screenshots,
    newCode,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    contentRef,
    handleDeleteScreenshot,
    refetch,
  };
}

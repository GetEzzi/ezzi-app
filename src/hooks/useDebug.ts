import { useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/toast';
import { useScreenshots } from './useScreenshots';
import { useScreenshotEvents } from './useScreenshotEvents';
import { useSolutionContext } from '../contexts/SolutionContext';

export function useDebug(
  isProcessing: boolean,
  setIsProcessing: (processing: boolean) => void,
) {
  const { showToast } = useToast();
  const { state: solutionState } = useSolutionContext();
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    screenshots,
    refetch,
    handleDeleteScreenshot: deleteScreenshot,
  } = useScreenshots();

  const [newCode, setNewCode] = useState<string | null>(null);
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null);
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null,
  );
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null,
  );

  const handleDeleteScreenshot = async (index: number) => {
    await deleteScreenshot(index);
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
    if (solutionState.newSolution) {
      setNewCode(solutionState.newSolution.code || null);
      setThoughtsData(
        'thoughts' in solutionState.newSolution
          ? solutionState.newSolution.thoughts || null
          : null,
      );
      setTimeComplexityData(
        'time_complexity' in solutionState.newSolution
          ? solutionState.newSolution.time_complexity || null
          : null,
      );
      setSpaceComplexityData(
        'space_complexity' in solutionState.newSolution
          ? solutionState.newSolution.space_complexity || null
          : null,
      );
      setIsProcessing(false);
    }

    const cleanupFunctions = [
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
  }, [solutionState.newSolution, setIsProcessing, showToast]);

  useScreenshotEvents({ refetch });

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

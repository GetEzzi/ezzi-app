import { useState, useEffect, useRef } from 'react';
import { SolveResponse, LeetCodeSolveResponse } from '@shared/api.ts';
import { useToast } from '../contexts/toast';
import { useScreenshots } from './useScreenshots';
import { useScreenshotEvents } from './useScreenshotEvents';
import { useSolutionContext } from '../contexts/SolutionContext';

export function useSolutions() {
  const {
    state: solutionState,
    setSolution,
    setNewSolution,
    clearAll,
  } = useSolutionContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [debugProcessing, setDebugProcessing] = useState(false);
  const [solutionData, setSolutionData] = useState<string | null>(null);
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null);
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null,
  );
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null,
  );
  const [isResetting, setIsResetting] = useState(false);

  const {
    screenshots,
    handleDeleteScreenshot: deleteScreenshot,
    clearScreenshots,
  } = useScreenshots();

  const handleDeleteScreenshot = async (index: number) => {
    const success = await deleteScreenshot(index);
    if (!success) {
      showToast('Error', 'Failed to delete the screenshot', 'error');
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
          source: 'useSolutions',
        })
        .catch(console.error);
    }
  };

  // Update local state when context solution changes
  useEffect(() => {
    if (solutionState.solution) {
      setSolutionData(solutionState.solution.code || null);
      setThoughtsData(
        'thoughts' in solutionState.solution
          ? solutionState.solution.thoughts || null
          : null,
      );
      setTimeComplexityData(
        'time_complexity' in solutionState.solution
          ? solutionState.solution.time_complexity || null
          : null,
      );
      setSpaceComplexityData(
        'space_complexity' in solutionState.solution
          ? solutionState.solution.space_complexity || null
          : null,
      );
    }
  }, [solutionState.solution]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    const mutationObserver = new MutationObserver(updateDimensions);
    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    updateDimensions();

    const cleanupFunctions = [
      window.electronAPI.onSolutionStart(() => {
        setSolutionData(null);
        setThoughtsData(null);
        setTimeComplexityData(null);
        setSpaceComplexityData(null);
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Processing Failed', error, 'error');
        // Restore previous solution data on error
        if (solutionState.solution) {
          setSolutionData(solutionState.solution.code || null);
          setThoughtsData(
            'thoughts' in solutionState.solution
              ? solutionState.solution.thoughts || null
              : null,
          );
          setTimeComplexityData(
            'time_complexity' in solutionState.solution
              ? solutionState.solution.time_complexity || null
              : null,
          );
          setSpaceComplexityData(
            'space_complexity' in solutionState.solution
              ? solutionState.solution.space_complexity || null
              : null,
          );
        }
      }),
      window.electronAPI.onSolutionSuccess(
        (data: SolveResponse | LeetCodeSolveResponse) => {
          if (!data) {
            return;
          }
          setSolution(data);
          setSolutionData(data.code || null);
          setThoughtsData('thoughts' in data ? data.thoughts || null : null);
          setTimeComplexityData(
            'time_complexity' in data ? data.time_complexity || null : null,
          );
          setSpaceComplexityData(
            'space_complexity' in data ? data.space_complexity || null : null,
          );
          clearScreenshots();
        },
      ),
      window.electronAPI.onDebugStart(() => setDebugProcessing(true)),
      window.electronAPI.onDebugSuccess((data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setNewSolution(data);
        setDebugProcessing(false);
        clearScreenshots();
      }),
      window.electronAPI.onDebugError(() => {
        showToast(
          'Processing Failed',
          'There was an error debugging your code.',
          'error',
        );
        setDebugProcessing(false);
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
      mutationObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    showToast,
    setSolution,
    setNewSolution,
    solutionState.solution,
    clearScreenshots,
  ]);

  useScreenshotEvents({
    onResetView: () => {
      setIsResetting(true);
      clearAll();
      setTimeout(() => setIsResetting(false), 0);
    },
  });

  return {
    debugProcessing,
    solutionData,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    isResetting,
    screenshots,
    contentRef,
    handleDeleteScreenshot,
    setDebugProcessing,
  };
}

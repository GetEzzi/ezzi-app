import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Screenshot,
  SolveResponse,
  LeetCodeSolveResponse,
} from '@shared/api.ts';
import { useToast } from '../contexts/toast';

export function useSolutions() {
  const queryClient = useQueryClient();
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
  const [extraScreenshots, setExtraScreenshots] = useState<Screenshot[]>([]);

  const fetchScreenshots = async () => {
    try {
      const existing = await window.electronAPI.getScreenshots();
      const screenshots = (Array.isArray(existing) ? existing : []).map(
        (p) => ({
          id: p.path,
          path: p.path,
          preview: p.preview,
          timestamp: Date.now(),
        }),
      );
      setExtraScreenshots(screenshots);
    } catch (error) {
      console.error('Error loading extra screenshots:', error);
      setExtraScreenshots([]);
    }
  };

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index];

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path,
      );

      if (response.success) {
        const existing = await window.electronAPI.getScreenshots();
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now(),
          }),
        );
        setExtraScreenshots(screenshots);
      } else {
        console.error('Failed to delete extra screenshot:', response.error);
        showToast('Error', 'Failed to delete the screenshot', 'error');
      }
    } catch (error) {
      console.error('Error deleting extra screenshot:', error);
      showToast('Error', 'Failed to delete the screenshot', 'error');
    }
  };

  useEffect(() => {
    fetchScreenshots().catch(console.error);
  }, [solutionData]);

  useEffect(() => {
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => {
        fetchScreenshots().catch(console.error);
      }),
      window.electronAPI.onResetView(() => {
        setIsResetting(true);
        queryClient.removeQueries({ queryKey: ['solution'] });
        queryClient.removeQueries({ queryKey: ['new_solution'] });
        setExtraScreenshots([]);
        setTimeout(() => setIsResetting(false), 0);
      }),
      window.electronAPI.onSolutionStart(() => {
        setSolutionData(null);
        setThoughtsData(null);
        setTimeComplexityData(null);
        setSpaceComplexityData(null);
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Processing Failed', error, 'error');
        const solution = queryClient.getQueryData(['solution']) as {
          code: string;
          thoughts: string[];
          time_complexity: string;
          space_complexity: string;
        } | null;
        setSolutionData(solution?.code || null);
        setThoughtsData(solution?.thoughts || null);
        setTimeComplexityData(solution?.time_complexity || null);
        setSpaceComplexityData(solution?.space_complexity || null);
      }),
      window.electronAPI.onSolutionSuccess(
        (data: SolveResponse | LeetCodeSolveResponse) => {
          if (!data) {
            return;
          }
          queryClient.setQueryData(['solution'], data);
          setSolutionData(data.code || null);
          setThoughtsData('thoughts' in data ? data.thoughts || null : null);
          setTimeComplexityData(
            'time_complexity' in data ? data.time_complexity || null : null,
          );
          setSpaceComplexityData(
            'space_complexity' in data ? data.space_complexity || null : null,
          );
          setExtraScreenshots([]);
        },
      ),
      window.electronAPI.onDebugStart(() => setDebugProcessing(true)),
      window.electronAPI.onDebugSuccess((data) => {
        queryClient.setQueryData(['new_solution'], data);
        setDebugProcessing(false);
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
          'There are no extra screenshots to process.',
          'neutral',
        );
      }),
    ];

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [queryClient, showToast]);

  useEffect(() => {
    setSolutionData(queryClient.getQueryData(['solution']) || null);

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query.queryKey &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'solution'
      ) {
        const solution = queryClient.getQueryData([
          'solution',
        ]) as SolveResponse;
        setSolutionData(solution?.code ?? null);
        setThoughtsData(solution?.thoughts ?? null);
        setTimeComplexityData(solution?.time_complexity ?? null);
        setSpaceComplexityData(solution?.space_complexity ?? null);
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return {
    debugProcessing,
    solutionData,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    isResetting,
    extraScreenshots,
    contentRef,
    handleDeleteExtraScreenshot,
    setDebugProcessing,
  };
}

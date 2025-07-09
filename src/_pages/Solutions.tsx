import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ScreenshotQueue from '../components/Queue/ScreenshotQueue';
import { Screenshot, SolveResponse, ProgrammingLanguage } from '@shared/api.ts';
import SolutionCommands from '../components/Solutions/SolutionCommands';
import SolutionContent from '../components/Solutions/SolutionContent';
import ThoughtsList from '../components/Solutions/ThoughtsList';
import CodeBlock from '../components/Solutions/CodeBlock';
import Debug from './Debug';
import { useToast } from '../contexts/toast';

export interface SolutionsProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  currentLanguage: ProgrammingLanguage;
}
const Solutions: React.FC<SolutionsProps> = ({ setView, currentLanguage }) => {
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

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

  const { showToast } = useToast();

  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        const existing = await window.electronAPI.getScreenshots();
        console.log('Raw screenshot data:', existing);
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now(),
          }),
        );
        console.log('Processed screenshots:', screenshots);
        setExtraScreenshots(screenshots);
      } catch (error) {
        console.error('Error loading extra screenshots:', error);
        setExtraScreenshots([]);
      }
    };

    fetchScreenshots().catch(console.error);
  }, [solutionData]);

  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const contentWidth = contentRef.current.scrollWidth;
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
      window.electronAPI.onScreenshotTaken(async () => {
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
        }
      }),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true);

        // Remove queries
        queryClient.removeQueries({
          queryKey: ['solution'],
        });
        queryClient.removeQueries({
          queryKey: ['new_solution'],
        });

        // Reset screenshots
        setExtraScreenshots([]);

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false);
        }, 0);
      }),

      // SOLUTION EVENTS
      window.electronAPI.onSolutionStart(() => {
        // Every time processing starts, reset relevant states
        setSolutionData(null);
        setThoughtsData(null);
        setTimeComplexityData(null);
        setSpaceComplexityData(null);
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Processing Failed', error, 'error');
        // Reset solutions in the cache (even though this shouldn't ever happen) and complexities to previous states
        const solution = queryClient.getQueryData(['solution']) as {
          code: string;
          thoughts: string[];
          time_complexity: string;
          space_complexity: string;
        } | null;
        if (!solution) {
          setView('queue');
        }
        setSolutionData(solution?.code || null);
        setThoughtsData(solution?.thoughts || null);
        setTimeComplexityData(solution?.time_complexity || null);
        setSpaceComplexityData(solution?.space_complexity || null);
        console.error('Processing error:', error);
      }),
      window.electronAPI.onSolutionSuccess((data: SolveResponse) => {
        if (!data) {
          console.warn('Received empty or invalid solution data');

          return;
        }

        queryClient.setQueryData(['solution'], data);
        setSolutionData(data.code || null);
        setThoughtsData(data.thoughts || null);
        setTimeComplexityData(data.time_complexity || null);
        setSpaceComplexityData(data.space_complexity || null);

        setExtraScreenshots([]);
      }),

      // DEBUG EVENTS
      window.electronAPI.onDebugStart(() => {
        //we'll set the debug processing state to true and use that to render a little loader
        setDebugProcessing(true);
      }),
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
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    setSolutionData(queryClient.getQueryData(['solution']) || null);

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (event?.query.queryKey[0] === 'solution') {
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

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index];

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path,
      );

      if (response.success) {
        // Fetch and update screenshots after successful deletion
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

  return (
    <>
      {!isResetting && queryClient.getQueryData(['new_solution']) ? (
        <Debug
          isProcessing={debugProcessing}
          setIsProcessing={setDebugProcessing}
          currentLanguage={currentLanguage}
        />
      ) : (
        <div ref={contentRef} className="relative space-y-3 px-4 py-3">
          {solutionData && (
            <div className="bg-transparent w-fit">
              <div className="pb-3">
                <div className="space-y-3 w-fit">
                  <ScreenshotQueue
                    isLoading={debugProcessing}
                    screenshots={extraScreenshots}
                    onDeleteScreenshot={handleDeleteExtraScreenshot}
                  />
                </div>
              </div>
            </div>
          )}

          <SolutionCommands
            isProcessing={!solutionData}
            extraScreenshots={extraScreenshots}
          />

          <div className="w-full space-y-4">
            {!solutionData && (
              <SolutionContent
                title="Generating solution"
                content="..."
                isLoading={true}
              />
            )}

            {solutionData && (
              <>
                {/* Probably not required */}
                {/*<SolutionContent*/}
                {/*  title={`Analyzing Problem`}*/}
                {/*  content={problemStatementData}*/}
                {/*  isLoading={!problemStatementData}*/}
                {/*/>*/}

                <SolutionContent
                  title="My Thoughts"
                  content={
                    thoughtsData && <ThoughtsList thoughts={thoughtsData} />
                  }
                  isLoading={!thoughtsData}
                />

                <SolutionContent
                  title="Solution"
                  content={
                    solutionData && (
                      <CodeBlock
                        code={solutionData}
                        language={currentLanguage}
                      />
                    )
                  }
                  isLoading={!solutionData}
                  type="code"
                />

                <SolutionContent
                  title="Complexity"
                  content={
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                        <div>
                          <strong>Time:</strong> {timeComplexityData}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                        <div>
                          <strong>Space:</strong> {spaceComplexityData}
                        </div>
                      </div>
                    </div>
                  }
                  isLoading={!timeComplexityData || !spaceComplexityData}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Solutions;

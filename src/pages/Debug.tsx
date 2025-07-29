import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import ScreenshotQueue from '../components/Queue/ScreenshotQueue';
import SolutionCommands from '../components/Solutions/SolutionCommands';
import SolutionContent from '../components/Solutions/SolutionContent';
import ThoughtsList from '../components/Solutions/ThoughtsList';
import CodeBlock from '../components/Solutions/CodeBlock';
import { DebugResponse, Screenshot } from '@shared/api.ts';
import { useToast } from '../contexts/toast';
import { ProgrammingLanguage } from '@shared/api.ts';

async function fetchScreenshots() {
  try {
    const existing = await window.electronAPI.getScreenshots();
    console.log('Raw screenshot data in Debug:', existing);

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

interface DebugProps {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  currentLanguage: ProgrammingLanguage;
}

const Debug: React.FC<DebugProps> = ({
  isProcessing,
  setIsProcessing,
  currentLanguage,
}) => {
  const { showToast } = useToast();

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

  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSolution = queryClient.getQueryData([
      'new_solution',
    ]) as DebugResponse;

    if (newSolution) {
      setNewCode(newSolution.code || null);
      setThoughtsData(newSolution.thoughts || null);
      setTimeComplexityData(newSolution.time_complexity || null);
      setSpaceComplexityData(newSolution.space_complexity || null);
      setIsProcessing(false);
    }

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onDebugSuccess(() => {
        setIsProcessing(false);
      }),
      window.electronAPI.onDebugStart(() => {
        setIsProcessing(true);
      }),
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

    // Set up resize observer
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

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [queryClient, setIsProcessing]);

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index];

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path,
      );

      if (response.success) {
        await refetch();
      } else {
        console.error('Failed to delete extra screenshot:', response.error);
      }
    } catch (error) {
      console.error('Error deleting extra screenshot:', error);
    }
  };

  return (
    <div ref={contentRef} className="relative space-y-3 px-4 py-3">
      {/* Conditionally render the screenshot queue */}
      <div className="bg-transparent w-fit">
        <div className="pb-3">
          <div className="space-y-3 w-fit">
            <ScreenshotQueue
              screenshots={screenshots}
              onDeleteScreenshot={handleDeleteExtraScreenshot}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Navbar of commands with the tooltip */}
      <SolutionCommands
        screenshots={screenshots}
        isProcessing={isProcessing}
        extraScreenshots={screenshots}
      />

      {/* Main Content */}
      <div className="w-full space-y-4">
        <SolutionContent
          title="What I Changed"
          content={thoughtsData && <ThoughtsList thoughts={thoughtsData} />}
          isLoading={!thoughtsData}
        />

        <SolutionContent
          title="Solution"
          content={
            newCode && <CodeBlock code={newCode} language={currentLanguage} />
          }
          isLoading={!newCode}
          type="code"
        />

        <SolutionContent
          title="Complexity"
          content={
            <div className="space-y-2 font-normal">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                <div>
                  <span className="font-medium">Time:</span>{' '}
                  {timeComplexityData}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                <div>
                  <span className="font-medium">Space:</span>{' '}
                  {spaceComplexityData}
                </div>
              </div>
            </div>
          }
          isLoading={!timeComplexityData || !spaceComplexityData}
        />
      </div>
    </div>
  );
};

export default Debug;

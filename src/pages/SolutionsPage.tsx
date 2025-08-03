import React from 'react';
import { useSolutions } from '../hooks';
import {
  useAppModeLayout,
  LiveInterviewLayout,
  LeetcodeSolverLayout,
} from '../layouts';
import {
  ScreenshotSection,
  SolutionSection,
  CommandSection,
} from '../components/sections';
import DebugPage from './DebugPage';
import { useQueryClient } from '@tanstack/react-query';

interface SolutionsPageProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
}

const SolutionsPage: React.FC<SolutionsPageProps> = ({ setView: _setView }) => {
  const { isLiveInterview } = useAppModeLayout();
  const queryClient = useQueryClient();
  const {
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
  } = useSolutions();

  // Check if we should show debug view
  if (!isResetting && queryClient.getQueryData(['new_solution'])) {
    return (
      <DebugPage
        isProcessing={debugProcessing}
        setIsProcessing={setDebugProcessing}
      />
    );
  }

  const screenshotSection =
    solutionData && extraScreenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={extraScreenshots}
        onDeleteScreenshot={handleDeleteExtraScreenshot}
        isLoading={debugProcessing}
      />
    ) : null;

  const commandSection = (
    <CommandSection
      mode="solutions"
      isProcessing={!solutionData}
      extraScreenshots={extraScreenshots}
    />
  );

  const solutionSection = (
    <SolutionSection
      solutionData={solutionData}
      thoughtsData={thoughtsData}
      timeComplexityData={timeComplexityData}
      spaceComplexityData={spaceComplexityData}
      isGenerating={!solutionData}
    />
  );

  if (isLiveInterview) {
    return (
      <div ref={contentRef} className="relative space-y-3 px-4 py-3">
        <LiveInterviewLayout
          screenshotSection={screenshotSection}
          commandSection={commandSection}
          solutionSection={solutionSection}
        />
      </div>
    );
  } else {
    return (
      <div ref={contentRef} className="w-full">
        <LeetcodeSolverLayout
          screenshotSection={screenshotSection}
          commandSection={commandSection}
          solutionSection={solutionSection}
        />
      </div>
    );
  }
};

export default SolutionsPage;

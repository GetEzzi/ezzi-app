import type React from 'react';
import { CommandSection, ScreenshotSection, SolutionSection } from '../components/sections';
import { useSolutionContext } from '../contexts/SolutionContext';
import { useSolutions } from '../hooks';
import { LeetcodeSolverLayout, LiveInterviewLayout, useAppModeLayout } from '../layouts';
import DebugPage from './DebugPage';

interface SolutionsPageProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
}

const SolutionsPage: React.FC<SolutionsPageProps> = ({ setView: _setView }) => {
  const { isLiveInterview } = useAppModeLayout();
  const { state: solutionState } = useSolutionContext();
  const {
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
  } = useSolutions();

  // Check if we should show debug view
  if (!isResetting && solutionState.newSolution) {
    return <DebugPage isProcessing={debugProcessing} setIsProcessing={setDebugProcessing} />;
  }

  const screenshotSection =
    solutionData && screenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={screenshots}
        onDeleteScreenshot={handleDeleteScreenshot}
        isLoading={debugProcessing}
      />
    ) : null;

  const commandSection = (
    <CommandSection mode="solutions" isProcessing={!solutionData} screenshots={screenshots} />
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

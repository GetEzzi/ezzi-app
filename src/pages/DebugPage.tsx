import type React from 'react';
import { CommandSection, ScreenshotSection, SolutionSection } from '../components/sections';
import { useDebug } from '../hooks';
import { LeetcodeSolverLayout, LiveInterviewLayout, useAppModeLayout } from '../layouts';

interface DebugPageProps {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

const DebugPage: React.FC<DebugPageProps> = ({ isProcessing, setIsProcessing }) => {
  const { isLiveInterview } = useAppModeLayout();
  const {
    screenshots,
    newCode,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    contentRef,
    handleDeleteScreenshot,
  } = useDebug(isProcessing, setIsProcessing);

  const screenshotSection =
    screenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={screenshots}
        onDeleteScreenshot={handleDeleteScreenshot}
        isLoading={isProcessing}
      />
    ) : null;

  const commandSection = (
    <CommandSection mode="debug" isProcessing={isProcessing} screenshots={screenshots} />
  );

  const solutionSection = (
    <SolutionSection
      solutionData={newCode}
      thoughtsData={thoughtsData}
      timeComplexityData={timeComplexityData}
      spaceComplexityData={spaceComplexityData}
      title="Solution"
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

export default DebugPage;

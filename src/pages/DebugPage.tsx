import React from 'react';
import { ProgrammingLanguage } from '../../shared/api';
import { useDebug } from '../hooks';
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

interface DebugPageProps {
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  currentLanguage: ProgrammingLanguage;
}

const DebugPage: React.FC<DebugPageProps> = ({
  isProcessing,
  setIsProcessing,
  currentLanguage,
}) => {
  const { isLiveInterview } = useAppModeLayout();
  const {
    screenshots,
    newCode,
    thoughtsData,
    timeComplexityData,
    spaceComplexityData,
    contentRef,
    handleDeleteExtraScreenshot,
  } = useDebug(isProcessing, setIsProcessing);

  const screenshotSection =
    screenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={screenshots}
        onDeleteScreenshot={handleDeleteExtraScreenshot}
        isLoading={isProcessing}
      />
    ) : null;

  const commandSection = (
    <CommandSection
      mode="debug"
      isProcessing={isProcessing}
      screenshots={screenshots}
      extraScreenshots={screenshots}
    />
  );

  const solutionSection = (
    <SolutionSection
      solutionData={newCode}
      thoughtsData={thoughtsData}
      timeComplexityData={timeComplexityData}
      spaceComplexityData={spaceComplexityData}
      currentLanguage={currentLanguage}
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

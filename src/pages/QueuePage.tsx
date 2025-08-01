import React from 'react';
import { ProgrammingLanguage, UserLanguage } from '@shared/api.ts';
import { useQueue } from '../hooks';
import {
  useAppModeLayout,
  LiveInterviewLayout,
  LeetcodeSolverLayout,
} from '../layouts';
import { ScreenshotSection, CommandSection } from '../components/sections';

interface QueuePageProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  setLanguage: (language: ProgrammingLanguage) => void;
  setLocale: (language: UserLanguage) => void;
}

const QueuePage: React.FC<QueuePageProps> = ({
  setView: _setView,
  currentLanguage,
  currentLocale,
  setLanguage,
  setLocale,
}) => {
  const { isLiveInterview } = useAppModeLayout();
  const {
    screenshots,
    handleDeleteScreenshot,
    handleTooltipVisibilityChange,
    contentRef,
  } = useQueue();

  const screenshotSection =
    screenshots.length > 0 ? (
      <ScreenshotSection
        screenshots={screenshots}
        onDeleteScreenshot={handleDeleteScreenshot}
        isLoading={false}
      />
    ) : null;

  const commandSection = (
    <CommandSection
      mode="queue"
      onTooltipVisibilityChange={handleTooltipVisibilityChange}
      screenshotCount={screenshots.length}
      currentLanguage={currentLanguage}
      currentLocale={currentLocale}
      setLanguage={setLanguage}
      setLocale={setLocale}
    />
  );

  if (isLiveInterview) {
    return (
      <div ref={contentRef} className="bg-transparent w-1/2">
        <div className="px-4 py-3">
          <div className="space-y-3 w-fit">
            <LiveInterviewLayout
              screenshotSection={screenshotSection}
              commandSection={commandSection}
            />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div ref={contentRef} className="bg-transparent w-full">
        <LeetcodeSolverLayout
          screenshotSection={screenshotSection}
          commandSection={commandSection}
        />
      </div>
    );
  }
};

export default QueuePage;

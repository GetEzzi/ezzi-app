import type React from 'react';
import { CommandSection, ScreenshotSection } from '../components/sections';
import { useQueue } from '../hooks';
import { LeetcodeSolverLayout, LiveInterviewLayout, useAppModeLayout } from '../layouts';

interface QueuePageProps {
  setView: (view: 'queue' | 'solutions' | 'debug') => void;
}

const QueuePage: React.FC<QueuePageProps> = ({ setView: _setView }) => {
  const { isLiveInterview } = useAppModeLayout();
  const { screenshots, handleDeleteScreenshot, handleTooltipVisibilityChange, contentRef } =
    useQueue();

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

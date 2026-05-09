import type React from 'react';
import type { Screenshot } from '../../../shared/api';
import ScreenshotQueue from '../Queue/ScreenshotQueue';

interface ScreenshotSectionProps {
  screenshots: Screenshot[];
  onDeleteScreenshot: (index: number) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const ScreenshotSection: React.FC<ScreenshotSectionProps> = ({
  screenshots,
  onDeleteScreenshot,
  isLoading = false,
  className = '',
}) => {
  if (screenshots.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <ScreenshotQueue
        screenshots={screenshots}
        onDeleteScreenshot={onDeleteScreenshot}
        isLoading={isLoading}
      />
    </div>
  );
};

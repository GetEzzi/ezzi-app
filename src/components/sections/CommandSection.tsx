import React from 'react';
import QueueCommands from '../Queue/QueueCommands';
import SolutionCommands from '../Solutions/SolutionCommands';
import { Screenshot } from '../../../shared/api';

type CommandSectionMode = 'queue' | 'solutions' | 'debug';

interface CommandSectionProps {
  mode: CommandSectionMode;
  // Queue mode props
  onTooltipVisibilityChange?: (visible: boolean, height: number) => void;
  screenshotCount?: number;
  // Solutions/Debug mode props
  isProcessing?: boolean;
  screenshots?: Screenshot[];
  extraScreenshots?: Screenshot[];
  className?: string;
}

export const CommandSection: React.FC<CommandSectionProps> = ({
  mode,
  onTooltipVisibilityChange,
  screenshotCount = 0,
  isProcessing = false,
  screenshots = [],
  extraScreenshots = [],
  className = '',
}) => {
  // const { isLeetcodeSolver } = useAppModeLayout(); // For future use

  if (mode === 'queue') {
    if (!onTooltipVisibilityChange) {
      return null;
    }

    return (
      <div className={className}>
        <QueueCommands
          onTooltipVisibilityChange={onTooltipVisibilityChange}
          screenshotCount={screenshotCount}
        />
      </div>
    );
  }

  if (mode === 'solutions' || mode === 'debug') {
    return (
      <div className={className}>
        <SolutionCommands
          isProcessing={isProcessing}
          screenshots={screenshots}
          extraScreenshots={extraScreenshots}
        />
      </div>
    );
  }

  return null;
};

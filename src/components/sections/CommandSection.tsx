import React from 'react';
import QueueCommands from '../Queue/QueueCommands';
import SolutionCommands from '../Solutions/SolutionCommands';
import {
  ProgrammingLanguage,
  UserLanguage,
  Screenshot,
} from '../../../shared/api';
// import { useAppModeLayout } from '../../layouts'; // For future mode-specific styling

type CommandSectionMode = 'queue' | 'solutions' | 'debug';

interface CommandSectionProps {
  mode: CommandSectionMode;
  // Queue mode props
  onTooltipVisibilityChange?: (visible: boolean, height: number) => void;
  screenshotCount?: number;
  currentLanguage?: ProgrammingLanguage;
  currentLocale?: UserLanguage;
  setLanguage?: (language: ProgrammingLanguage) => void;
  setLocale?: (language: UserLanguage) => void;
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
  currentLanguage,
  currentLocale,
  setLanguage,
  setLocale,
  isProcessing = false,
  screenshots = [],
  extraScreenshots = [],
  className = '',
}) => {
  // const { isLeetcodeSolver } = useAppModeLayout(); // For future use

  if (mode === 'queue') {
    if (
      !currentLanguage ||
      !currentLocale ||
      !setLanguage ||
      !setLocale ||
      !onTooltipVisibilityChange
    ) {
      return null;
    }

    return (
      <div className={className}>
        <QueueCommands
          onTooltipVisibilityChange={onTooltipVisibilityChange}
          screenshotCount={screenshotCount}
          currentLanguage={currentLanguage}
          currentLocale={currentLocale}
          setLanguage={setLanguage}
          setLocale={setLocale}
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

import React from 'react';
import { COMMAND_KEY } from '../../utils/platform';
import { authService } from '../../services/auth.ts';
import { useAppMode } from '../../contexts/appMode';
import { AppModeIndicator } from './AppModeIndicator';
import CommandButton from '../shared/commands/CommandButton';
import CommandSeparator from '../shared/commands/CommandSeparator';
import SettingsTooltip from '../shared/commands/SettingsTooltip';
import { ConversationMode } from '../Conversation';

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  screenshotCount?: number;
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshotCount = 0,
}) => {
  const { currentAppMode, setAppMode } = useAppMode();

  const handleSignOut = () => {
    authService.signOut().catch(console.error);
  };

  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="text-xs text-gray-100 bg-[#1E2530]/80 rounded-lg py-2 px-4">
          {/* Top section - Full width AppModeIndicator */}
          <div className="w-full mb-2">
            <AppModeIndicator />
          </div>

          {/* Bottom section - All buttons in horizontal layout */}
          <div className="flex items-center justify-center gap-4">

            {/* Conversation Mode - Audio transcription and AI answers */}
            <ConversationMode />

            <CommandSeparator />

            {/* Screenshot */}
            <CommandButton
              label={
                screenshotCount === 0
                  ? 'Take first screenshot'
                  : screenshotCount === 1
                    ? 'Take next screenshot'
                    : 'Reset first screenshot'
              }
              shortcut="H"
            />

            {/* Solve Command */}
            {screenshotCount > 0 && (
              <CommandButton label="Solve" shortcut="↵" />
            )}

            {/* Start Over - Always visible */}
            {screenshotCount > 0 && (
              <CommandButton label="Start Over" shortcut="G" />
            )}

            <CommandSeparator />

            {/* Settings with Tooltip - Only show when no screenshots */}
            {screenshotCount === 0 && (
              <SettingsTooltip
                shortcuts={[
                  {
                    label: 'Toggle Window',
                    shortcut: [COMMAND_KEY, 'B'],
                    description: 'Show or hide this window.',
                  },
                  {
                    label: 'Take Screenshot',
                    shortcut: [COMMAND_KEY, 'H'],
                    description:
                      'Take a screenshot of the problem description.',
                  },
                  {
                    label: 'Solve',
                    shortcut: [COMMAND_KEY, '↵'],
                    description:
                      screenshotCount > 0
                        ? 'Generate a solution based on the current problem.'
                        : 'Take a screenshot first to generate a solution.',
                    condition: screenshotCount > 0,
                  },
                  {
                    label: 'Start Over',
                    shortcut: [COMMAND_KEY, 'G'],
                    description: 'Start fresh with a new question.',
                    condition: screenshotCount > 0,
                  },
                ]}
                currentAppMode={currentAppMode}
                setAppMode={setAppMode}
                onSignOut={handleSignOut}
                onTooltipVisibilityChange={onTooltipVisibilityChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueCommands;

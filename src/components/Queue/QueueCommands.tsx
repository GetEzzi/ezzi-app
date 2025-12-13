import React from 'react';
import { COMMAND_KEY } from '../../utils/platform';
import { authService } from '../../services/auth.ts';
import { useAppMode } from '../../contexts/appMode';
import { AppModeIndicator } from './AppModeIndicator';
import CommandButton from '../shared/commands/CommandButton';
import CommandSeparator from '../shared/commands/CommandSeparator';
import SettingsTooltip from '../shared/commands/SettingsTooltip';
import { ConversationMode } from '../Conversation';

import { useConversation } from '../../contexts/ConversationContext';

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  screenshotCount?: number;
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshotCount = 0,
}) => {
  const { currentAppMode, setAppMode } = useAppMode();
  const { status, transcripts, answers } = useConversation();

  const isActive = status === 'active';
  const hasContent = transcripts.length > 0 || answers.length > 0;
  const showExpanded = isActive || hasContent;

  const handleSignOut = () => {
    authService.signOut().catch(console.error);
  };

  // Define the Extra Buttons (Screenshot & Settings)
  const extraButtons = (
    <>
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

      {screenshotCount > 0 && (
        <CommandButton label="Solve" shortcut="↵" />
      )}

      {screenshotCount > 0 && (
        <CommandButton label="Start Over" shortcut="G" />
      )}

      {/* Only show Settings if NOT expanded (or maybe allow it in expanded?) */}
      {/* In expanded mode, we might want less clutter, but user needs settings? */}
      {/* User didn't specify settings location in expanded mode. I'll hide it for now or include if space. */}
      {/* Let's keep it in extraButtons so it appears in the tool box if simple enough. */}
      {!showExpanded && screenshotCount === 0 && (
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
    </>
  );

  if (showExpanded) {
    // Render Expanded View (Takes over the container)
    // We pass extraButtons to ConversationMode
    return (
      <div className="pt-2 w-full max-w-[90vw]">
        <div className="text-xs text-gray-100 bg-[#1E2530]/95 backdrop-blur-xl rounded-lg py-4 px-4 border border-white/10 shadow-2xl">
          <AppModeIndicator />
          <div className="mt-4">
            <ConversationMode extraActions={extraButtons} />
          </div>
        </div>
      </div>
    );
  }

  // Render Compact View (Horizontal Bar)
  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="text-xs text-gray-100 bg-[#1E2530]/80 rounded-lg py-2 px-4">
          <div className="w-full mb-2">
            <AppModeIndicator />
          </div>

          <div className="flex items-center justify-center gap-4">
            <ConversationMode />
            <CommandSeparator />
            {extraButtons}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueCommands;

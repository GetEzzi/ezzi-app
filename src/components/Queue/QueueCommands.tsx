import React, { useState, useEffect, useRef } from 'react';
import { AuthenticatedUser, SubscriptionLevel } from '@shared/api.ts';
import { COMMAND_KEY } from '../../utils/platform';
import { authService } from '../../services/auth.ts';
import { useAppMode } from '../../contexts/appMode';
import { AppModeIndicator } from './AppModeIndicator';
import CommandButton from '../shared/commands/CommandButton';
import CommandSeparator from '../shared/commands/CommandSeparator';
import SettingsTooltip from '../shared/commands/SettingsTooltip';

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  screenshotCount?: number;
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshotCount = 0,
}) => {
  const [isTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const { currentAppMode, setAppMode } = useAppMode();

  useEffect(() => {
    // Fetch the current user when the component mounts
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser().catch(console.error);
  }, []);

  useEffect(() => {
    let tooltipHeight = 0;
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10;
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight);
  }, [isTooltipVisible]);

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
            {/* Free Plan Pill - Only show for FREE plan users */}
            {user && user.subscription.level === SubscriptionLevel.FREE && (
              <div className="w-33 bg-green-500/10 flex items-center gap-2 cursor-default rounded-sm px-2 py-1.5 transition-colors">
                <span className="leading-none bg-green-500/10">FREE</span>
                <div className="flex gap-1">
                  <button className="border border-green-500/20 cursor-default rounded-md px-1.5 py-1 leading-none text-green-400 font-medium">
                    solutions: {user.subscription.freeSolutions}
                  </button>
                </div>
              </div>
            )}

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

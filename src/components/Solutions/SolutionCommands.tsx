import React, { useState, useEffect } from 'react';
import {
  Screenshot,
  AuthenticatedUser,
  SubscriptionLevel,
} from '../../../shared/api';
import CommandButton from '../shared/commands/CommandButton';
import { authService } from '../../services/auth.ts';

export interface SolutionCommandsProps {
  isProcessing: boolean;
  screenshots?: Screenshot[];
  extraScreenshots?: Screenshot[];
}

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  isProcessing,
  extraScreenshots = [],
}) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

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

  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="text-xs text-gray-100 bg-[#1E2530]/80 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
          <CommandButton label="Show/Hide" shortcut="B" />

          {!isProcessing &&
            !(user && user.subscription.level === SubscriptionLevel.FREE) && (
              <>
                <CommandButton
                  label={
                    extraScreenshots.length === 0
                      ? 'Screenshot your code'
                      : 'Screenshot'
                  }
                  shortcut="H"
                />

                {extraScreenshots.length > 0 && (
                  <CommandButton label="Debug" shortcut="↵" />
                )}
              </>
            )}

          <CommandButton label="Start Over" shortcut="G" />
        </div>
      </div>
    </div>
  );
};

export default SolutionCommands;

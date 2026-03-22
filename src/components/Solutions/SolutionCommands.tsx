import React from 'react';
import { Screenshot } from '../../../shared/api';
import CommandButton from '../shared/commands/CommandButton';
import { useIsFreeUser } from '../../contexts/SubscriptionContext';

export interface SolutionCommandsProps {
  isProcessing: boolean;
  screenshots?: Screenshot[];
}

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  isProcessing,
  screenshots = [],
}) => {
  const isFree = useIsFreeUser();

  return (
    <div className="pt-2 w-fit">
      <div className="text-xs text-gray-100 bg-[#1E2530]/80 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
        <CommandButton label="Show/Hide" shortcut="B" />

        {!isProcessing && (
          <>
            <CommandButton
              label={
                screenshots.length === 0
                  ? 'Screenshot your code'
                  : 'Screenshot'
              }
              shortcut="H"
            />

            {screenshots.length > 0 && !isFree && (
              <CommandButton label="Debug" shortcut="↵" />
            )}
          </>
        )}

        <CommandButton label="Start Over" shortcut="G" />
      </div>
    </div>
  );
};

export default SolutionCommands;

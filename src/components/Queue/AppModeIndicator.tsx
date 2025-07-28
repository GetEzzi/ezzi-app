import React from 'react';
import { useAppMode } from '../../contexts/appMode';
import { AppMode } from '../../../shared/api';

export const AppModeIndicator: React.FC = () => {
  const { currentAppMode } = useAppMode();

  const getIndicatorConfig = () => {
    switch (currentAppMode) {
      case AppMode.LIVE_INTERVIEW:
        return {
          dotColor: 'bg-green-500',
          text: 'Live Interview - invisible',
        };
      case AppMode.LEETCODE_SOLVER:
        return {
          dotColor: 'bg-red-500',
          text: 'Leetcode Solver - visible',
        };
      default:
        return {
          dotColor: 'bg-gray-500',
          text: 'Unknown mode',
        };
    }
  };

  const { dotColor, text } = getIndicatorConfig();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
};

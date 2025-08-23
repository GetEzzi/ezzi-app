import React from 'react';
import { AppMode } from '@shared/api.ts';
import { getStorageProvider } from '../../services/storage';
import { AppModeHintBox } from './AppModeHintBox';

const APP_MODE_LABELS: Record<AppMode, string> = {
  [AppMode.LIVE_INTERVIEW]: 'Live Interview',
  [AppMode.LEETCODE_SOLVER]: 'Leetcode Solver (beta)',
};

interface AppModeSelectorProps {
  currentAppMode: AppMode;
  setAppMode: (appMode: AppMode) => void;
}

export const AppModeSelector: React.FC<AppModeSelectorProps> = ({
  currentAppMode,
  setAppMode,
}) => {
  const storageProvider = getStorageProvider();

  const handleAppModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAppMode = e.target.value as AppMode;

    setAppMode(newAppMode);

    if (!window.electronAPI) {
      storageProvider.setAppMode(newAppMode).catch((error) => {
        console.error('Error setting app mode in storage:', error);
      });
    }
  };

  return (
    <>
      <div className="mb-3 px-2 space-y-1">
        <div className="flex items-center justify-between text-[13px] font-medium text-white/90">
          <span>App Mode</span>
          <select
            value={currentAppMode}
            onChange={handleAppModeChange}
            className="bg-white/10 rounded-sm px-2 py-1 text-sm outline-hidden border border-white/10 focus:border-white/20"
          >
            {Object.entries(APP_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <AppModeHintBox currentAppMode={currentAppMode} />
    </>
  );
};

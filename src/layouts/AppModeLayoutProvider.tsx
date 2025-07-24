import React, { createContext, useContext, ReactNode } from 'react';
import { AppMode } from '../../shared/api';
import { useAppMode } from '../contexts/appMode';

interface AppModeLayoutContextType {
  currentAppMode: AppMode;
  isLiveInterview: boolean;
  isLeetcodeSolver: boolean;
}

const AppModeLayoutContext = createContext<
  AppModeLayoutContextType | undefined
>(undefined);

interface AppModeLayoutProviderProps {
  children: ReactNode;
}

export const AppModeLayoutProvider: React.FC<AppModeLayoutProviderProps> = ({
  children,
}) => {
  const { currentAppMode } = useAppMode();

  const value: AppModeLayoutContextType = {
    currentAppMode,
    isLiveInterview: currentAppMode === AppMode.LIVE_INTERVIEW,
    isLeetcodeSolver: currentAppMode === AppMode.LEETCODE_SOLVER,
  };

  return (
    <AppModeLayoutContext.Provider value={value}>
      {children}
    </AppModeLayoutContext.Provider>
  );
};

export function useAppModeLayout() {
  const context = useContext(AppModeLayoutContext);
  if (!context) {
    throw new Error(
      'useAppModeLayout must be used within an AppModeLayoutProvider',
    );
  }

  return context;
}

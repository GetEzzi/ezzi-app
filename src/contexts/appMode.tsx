import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { AppMode } from '../../shared/api';
import { getStorageProvider } from '../services/storage/index';

interface AppModeContextType {
  currentAppMode: AppMode;
  setAppMode: (appMode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

interface AppModeProviderProps {
  children: ReactNode;
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({
  children,
}) => {
  const [currentAppMode, setCurrentAppMode] = useState<AppMode>(
    AppMode.LIVE_INTERVIEW,
  );

  useEffect(() => {
    const loadInitialAppMode = async () => {
      try {
        if (window.electronAPI?.getAppMode) {
          const result = await window.electronAPI.getAppMode();
          if (result.success && result.appMode) {
            setCurrentAppMode(result.appMode);
            console.log('Loaded app mode from Electron:', result.appMode);
          }
        } else {
          const storageProvider = getStorageProvider();
          const storedAppMode = await storageProvider.getAppMode();
          setCurrentAppMode(storedAppMode);
        }
      } catch (error) {
        console.error('Error loading initial app mode:', error);
      }
    };

    void loadInitialAppMode();
  }, []);

  const setAppMode = (appMode: AppMode) => {
    setCurrentAppMode(appMode);

    if (window.electronAPI) {
      window.electronAPI.setAppMode(appMode).catch((error) => {
        console.error('Error updating app mode in Electron:', error);
      });
    }
  };

  return (
    <AppModeContext.Provider value={{ currentAppMode, setAppMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }

  return context;
}

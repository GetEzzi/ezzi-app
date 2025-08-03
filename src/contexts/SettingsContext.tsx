import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ProgrammingLanguage, UserLanguage } from '@shared/api.ts';
import { getStorageProvider } from '../services/storage';

interface SettingsContextType {
  solutionLanguage: ProgrammingLanguage;
  userLanguage: UserLanguage;
  loading: boolean;
  error: string | null;
  updateSolutionLanguage: (language: ProgrammingLanguage) => Promise<void>;
  updateUserLanguage: (language: UserLanguage) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [solutionLanguage, setSolutionLanguage] = useState<ProgrammingLanguage>(
    ProgrammingLanguage.Python,
  );
  const [userLanguage, setUserLanguage] = useState<UserLanguage>(
    UserLanguage.EN_US,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageProvider = getStorageProvider();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const settings = await storageProvider.getSettings();
      setSolutionLanguage(settings.solutionLanguage);
      setUserLanguage(settings.userLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [storageProvider]);

  const updateSolutionLanguage = useCallback(
    async (language: ProgrammingLanguage) => {
      try {
        setError(null);
        await storageProvider.setSolutionLanguage(language);
        setSolutionLanguage(language);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update solution language',
        );
        console.error('Error updating solution language:', err);

        throw err;
      }
    },
    [storageProvider],
  );

  const updateUserLanguage = useCallback(
    async (language: UserLanguage) => {
      try {
        setError(null);
        await storageProvider.setUserLanguage(language);
        setUserLanguage(language);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update user language',
        );
        console.error('Error updating user language:', err);

        throw err;
      }
    },
    [storageProvider],
  );

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const value: SettingsContextType = {
    solutionLanguage,
    userLanguage,
    loading,
    error,
    updateSolutionLanguage,
    updateUserLanguage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

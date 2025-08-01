import SubscribedApp from './pages/SubscribedApp';
import SubscribePage from './pages/SubscribePage';
import { AuthForm } from './pages/AuthForm.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './components/ui/toast';
import { ToastContext } from './contexts/toast';
import { AppModeProvider } from './contexts/appMode';
import {
  AuthenticatedUser,
  ProgrammingLanguage,
  SubscriptionLevel,
  UserLanguage,
} from '../shared/api';
import { authService } from './services/auth.ts';
import { getStorageProvider } from './services/storage';
import { getAuthProvider } from './services/auth/index';
import { isSelfHosted } from '@shared/constants.ts';

interface ToastState {
  open: boolean;
  title: string;
  description: string;
  variant: 'neutral' | 'success' | 'error';
}

interface AppState {
  isInitialized: boolean;
  user: AuthenticatedUser | null;
  loading: boolean;
  currentLanguage: ProgrammingLanguage;
  userLocale: UserLanguage;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppContentProps {
  isInitialized: boolean;
  user: AuthenticatedUser;
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  setLanguage: (language: ProgrammingLanguage) => void;
  setLocale: (language: UserLanguage) => void;
}

function AppContent({
  isInitialized,
  user,
  currentLanguage,
  currentLocale,
  setLanguage,
  setLocale,
}: AppContentProps) {
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = () => {
    try {
      setSubscriptionLoading(true);
      if (
        user.subscription.level === SubscriptionLevel.FREE &&
        user.subscription.freeSolutions === 0
      ) {
        setIsSubscribed(false);
      } else {
        setIsSubscribed(true);
      }
    } catch (_err) {
      setError('Failed to check subscription status');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Initial subscription check when component mounts or user.subscription changes
  useEffect(() => {
    checkSubscription();
  }, [user.subscription]);

  // Periodic subscription check every 15 seconds
  useEffect(() => {
    if (isSubscribed) {
      return;
    }

    const intervalId = setInterval(() => {
      authService
        .getCurrentUser()
        .then((updatedUser) => {
          if (
            updatedUser &&
            (updatedUser.subscription.level === SubscriptionLevel.PRO ||
              updatedUser.subscription.freeSolutions > 0)
          ) {
            setIsSubscribed(true);
          }
        })
        .catch((err) => {
          console.error('Error checking subscription status:', err);
        });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isSubscribed]);

  if (subscriptionLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm">
            {!isInitialized
              ? 'Initializing...If you see this screen for more than 10 seconds, please quit and restart the app.'
              : 'Checking subscription...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return <SubscribePage user={user} />;
  }

  return (
    <SubscribedApp
      currentLanguage={currentLanguage}
      currentLocale={currentLocale}
      setLanguage={setLanguage}
      setLocale={setLocale}
    />
  );
}

function useAppInitialization() {
  const [appState, setAppState] = useState<AppState>({
    isInitialized: false,
    user: null,
    loading: true,
    currentLanguage: ProgrammingLanguage.Python,
    userLocale: UserLanguage.EN_US,
  });

  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    title: '',
    description: '',
    variant: 'neutral',
  });

  const mountedRef = useRef(true);
  const initializationRef = useRef<{
    isInitializing: boolean;
  }>({
    isInitializing: false,
  });

  const updateLanguage = useCallback((newLanguage: ProgrammingLanguage) => {
    if (!mountedRef.current) {
      return;
    }
    setAppState((prev) => ({
      ...prev,
      currentLanguage: newLanguage,
    }));
    window.__LANGUAGE__ = newLanguage;
  }, []);

  const updateLocale = useCallback((newLocale: UserLanguage) => {
    if (!mountedRef.current) {
      return;
    }
    setAppState((prev) => ({
      ...prev,
      userLocale: newLocale,
    }));
    window.__LOCALE__ = newLocale;
  }, []);

  const markInitialized = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    setAppState((prev) => ({
      ...prev,
      isInitialized: true,
    }));
    window.__IS_INITIALIZED__ = true;
  }, []);

  const showToast = useCallback(
    (title: string, description: string, variant: ToastState['variant']) => {
      if (!mountedRef.current) {
        return;
      }
      setToastState({
        open: true,
        title,
        description,
        variant,
      });
    },
    [],
  );

  const initializeApp = useCallback(async () => {
    if (initializationRef.current.isInitializing) {
      return;
    }

    initializationRef.current.isInitializing = true;

    try {
      if (!mountedRef.current) {
        return;
      }
      setAppState((prev) => ({ ...prev, loading: true }));

      // In self-hosted mode, skip the initialization as AuthForm handles it
      if (isSelfHosted()) {
        setAppState((prev) => ({ ...prev, loading: false }));

        return;
      }

      const authProvider = getAuthProvider();
      const user = await authProvider.getCurrentUser();

      if (!mountedRef.current) {
        return;
      }

      if (!user) {
        await authProvider.clearAuthToken();
        setAppState((prev) => ({ ...prev, loading: false }));

        return;
      }

      setAppState((prev) => ({ ...prev, user }));

      const token = await authProvider.getAuthToken();
      if (!token) {
        setAppState((prev) => ({ ...prev, user: null, loading: false }));

        return;
      }

      try {
        const userSettings = await getStorageProvider().getSettings();

        if (!mountedRef.current) {
          return;
        }

        updateLanguage(userSettings.solutionLanguage);
        updateLocale(userSettings.userLanguage);

        markInitialized();
      } catch (settingsError) {
        if (!mountedRef.current) {
          return;
        }
        console.error('Error fetching user settings:', settingsError);
        showToast('Error', 'Failed to load user settings', 'error');
        markInitialized();
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      console.error('Initialization error:', error);
      const authProvider = getAuthProvider();
      await authProvider.clearAuthToken();
      setAppState((prev) => ({ ...prev, user: null, loading: false }));
      showToast('Error', 'Failed to initialize app', 'error');
    } finally {
      if (mountedRef.current) {
        setAppState((prev) => ({ ...prev, loading: false }));
        initializationRef.current.isInitializing = false;
      }
    }
  }, [setAppState, updateLanguage, markInitialized, showToast, updateLocale]);

  const setUser = useCallback(
    async (user: AuthenticatedUser | null) => {
      if (!mountedRef.current) {
        return;
      }
      setAppState((prev) => ({
        ...prev,
        user,
      }));

      if (user) {
        if (isSelfHosted()) {
          // In self-hosted mode, initialize settings directly
          try {
            const userSettings = await getStorageProvider().getSettings();
            updateLanguage(userSettings.solutionLanguage);
            updateLocale(userSettings.userLanguage);
            markInitialized();
          } catch (settingsError) {
            console.error(
              'Error fetching user settings in self-hosted mode:',
              settingsError,
            );
            showToast('Error', 'Failed to load user settings', 'error');
            markInitialized();
          }
        } else {
          initializeApp().catch(console.error);
        }
      }
    },
    [initializeApp, updateLanguage, updateLocale, markInitialized, showToast],
  );

  useEffect(() => {
    mountedRef.current = true;
    initializeApp().catch(console.error);

    return () => {
      mountedRef.current = false;
    };
  }, [initializeApp]);

  return {
    appState,
    toastState,
    setToastState,
    setUser,
    updateLanguage,
    showToast,
    updateLocale,
  };
}

function App() {
  const {
    appState,
    toastState,
    setToastState,
    setUser,
    updateLanguage,
    showToast,
    updateLocale,
  } = useAppInitialization();

  const loadingSpinner = useMemo(
    () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    ),
    [],
  );

  if (appState.loading) {
    return loadingSpinner;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastContext.Provider value={{ showToast }}>
          <AppModeProvider>
            {appState.user ? (
              <AppContent
                isInitialized={appState.isInitialized}
                user={appState.user}
                currentLanguage={appState.currentLanguage}
                currentLocale={appState.userLocale}
                setLanguage={updateLanguage}
                setLocale={updateLocale}
              />
            ) : (
              <AuthForm
                setUser={(user) => {
                  setUser(user).catch(console.error);
                }}
              />
            )}
            <Toast
              open={toastState.open}
              onOpenChange={(open) =>
                setToastState((prev) => ({ ...prev, open }))
              }
              variant={toastState.variant}
              duration={1500}
            >
              <ToastTitle>{toastState.title}</ToastTitle>
              <ToastDescription>{toastState.description}</ToastDescription>
            </Toast>
            <ToastViewport />
          </AppModeProvider>
        </ToastContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

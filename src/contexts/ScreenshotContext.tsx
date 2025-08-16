import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from 'react';
import { Screenshot } from '@shared/api.ts';

interface ScreenshotState {
  screenshots: Screenshot[];
  loading: boolean;
}

type ScreenshotAction =
  | { type: 'SET_SCREENSHOTS'; payload: Screenshot[] }
  | { type: 'CLEAR_SCREENSHOTS' }
  | { type: 'CLEAR_ALL_SCREENSHOTS' }
  | { type: 'DELETE_SCREENSHOT'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: ScreenshotState = {
  screenshots: [],
  loading: false,
};

function screenshotReducer(
  state: ScreenshotState,
  action: ScreenshotAction,
): ScreenshotState {
  switch (action.type) {
    case 'SET_SCREENSHOTS':
      return { ...state, screenshots: action.payload };
    case 'CLEAR_SCREENSHOTS':
      return { ...state, screenshots: [] };
    case 'CLEAR_ALL_SCREENSHOTS':
      return { ...state, screenshots: [] };
    case 'DELETE_SCREENSHOT':
      return {
        ...state,
        screenshots: state.screenshots.filter(
          (_, index) => index !== action.payload,
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

interface ScreenshotContextType {
  state: ScreenshotState;
  setScreenshots: (screenshots: Screenshot[]) => void;
  clearScreenshots: () => void;
  clearAllScreenshots: () => Promise<void>;
  deleteScreenshot: (index: number) => void;
  setLoading: (loading: boolean) => void;
}

const ScreenshotContext = createContext<ScreenshotContextType | undefined>(
  undefined,
);

export function ScreenshotProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(screenshotReducer, initialState);

  const setScreenshots = useCallback((screenshots: Screenshot[]) => {
    dispatch({ type: 'SET_SCREENSHOTS', payload: screenshots });
  }, []);

  const clearScreenshots = useCallback(() => {
    dispatch({ type: 'CLEAR_SCREENSHOTS' });
  }, []);

  const clearAllScreenshots = useCallback(async () => {
    try {
      const result = await window.electronAPI.clearAllScreenshots();
      if (result.success) {
        dispatch({ type: 'CLEAR_ALL_SCREENSHOTS' });
      } else {
        console.error('Failed to clear all screenshots:', result.error);
      }
    } catch (error) {
      console.error('Error clearing all screenshots:', error);
    }
  }, []);

  const deleteScreenshot = useCallback((index: number) => {
    dispatch({ type: 'DELETE_SCREENSHOT', payload: index });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  return (
    <ScreenshotContext.Provider
      value={{
        state,
        setScreenshots,
        clearScreenshots,
        clearAllScreenshots,
        deleteScreenshot,
        setLoading,
      }}
    >
      {children}
    </ScreenshotContext.Provider>
  );
}

export function useScreenshotContext() {
  const context = useContext(ScreenshotContext);
  if (!context) {
    throw new Error(
      'useScreenshotContext must be used within a ScreenshotProvider',
    );
  }

  return context;
}

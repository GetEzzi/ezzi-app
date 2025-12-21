import React, { useEffect, useRef, useState } from 'react';
import { QueuePage, SolutionsPage } from '.';
import { AppModeLayoutProvider } from '../layouts';
import { useToast } from '../contexts/toast';
import { SettingsProvider } from '../contexts/SettingsContext';
import {
  SolutionProvider,
  useSolutionContext,
} from '../contexts/SolutionContext';
import { ScreenshotProvider } from '../contexts/ScreenshotContext';
import { ConversationProvider } from '../contexts/ConversationContext';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SubscribedAppProps { }

const SubscribedAppContent: React.FC = () => {
  const { clearAll } = useSolutionContext();
  const [view, setView] = useState<'queue' | 'solutions' | 'debug'>('queue');
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const isInitializedRef = useRef(false);

  // Debounced dimension update function
  const updateDimensions = React.useCallback(() => {
    if (!containerRef.current) return;

    const height = containerRef.current.scrollHeight;
    const width = containerRef.current.scrollWidth;

    // For the first update, always apply it
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastDimensionsRef.current = { width, height };

      window.electronAPI
        ?.updateContentDimensions({ width, height, source: 'SubscribedApp' })
        .catch(console.error);
      return;
    }

    // Only update if dimensions changed significantly (more than 10px)
    const hasSignificantChange =
      Math.abs(lastDimensionsRef.current.width - width) > 10 ||
      Math.abs(lastDimensionsRef.current.height - height) > 10;

    if (hasSignificantChange) {
      lastDimensionsRef.current = { width, height };

      window.electronAPI
        ?.updateContentDimensions({ width, height, source: 'SubscribedApp' })
        .catch(console.error);
    }
  }, []);

  const debouncedUpdateDimensions = React.useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      updateDimensions();
    }, 200); // 200ms debounce
  }, [updateDimensions]);

  // Dynamically update the window size
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateDimensions();
    });
    resizeObserver.observe(containerRef.current);

    // Watch DOM changes
    const mutationObserver = new MutationObserver(() => {
      debouncedUpdateDimensions();
    });

    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Initial dimension update after a small delay
    const initialUpdateTimer = setTimeout(() => {
      updateDimensions();
    }, 100);

    return () => {
      clearTimeout(initialUpdateTimer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [debouncedUpdateDimensions, updateDimensions]);

  // Listen for events that might switch views or show errors
  useEffect(() => {
    const cleanupFunctions = [
      // PROCESSING_EVENTS.INITIAL_START
      window.electronAPI.onSolutionStart(() => {
        setView('solutions');
      }),
      window.electronAPI.onUnauthorized(() => {
        clearAll();
        setView('queue');
      }),
      window.electronAPI.onResetView(() => {
        clearAll();
        setView('queue');
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Error', error, 'error');
      }),
    ];

    return () => cleanupFunctions.forEach((fn) => fn());
  }, [clearAll, showToast]);

  return (
    <AppModeLayoutProvider>
      <div ref={containerRef} className="min-h-0">
        {view === 'queue' ? (
          <QueuePage setView={setView} />
        ) : view === 'solutions' ? (
          <SolutionsPage setView={setView} />
        ) : null}
      </div>
    </AppModeLayoutProvider>
  );
};

const SubscribedApp: React.FC<SubscribedAppProps> = () => {
  return (
    <SettingsProvider>
      <SolutionProvider>
        <ScreenshotProvider>
          <ConversationProvider>
            <SubscribedAppContent />
          </ConversationProvider>
        </ScreenshotProvider>
      </SolutionProvider>
    </SettingsProvider>
  );
};

export default SubscribedApp;

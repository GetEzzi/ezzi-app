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

  // Dynamically update the window size
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateDimensions = () => {
      if (!containerRef.current) {
        return;
      }
      const height = containerRef.current.scrollHeight;
      const width = containerRef.current.scrollWidth;
      window.electronAPI
        ?.updateContentDimensions({ width, height, source: 'SubscribedApp' })
        .catch(console.error);
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Also watch DOM changes
    const mutationObserver = new MutationObserver(updateDimensions);
    mutationObserver.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Initial dimension update
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [view]);

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

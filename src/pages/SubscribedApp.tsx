import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QueuePage, SolutionsPage } from '.';
import { AppModeLayoutProvider } from '../layouts';
import { useToast } from '../contexts/toast';
import { SettingsProvider } from '../contexts/SettingsContext';
import {
  SolutionProvider,
  useSolutionContext,
} from '../contexts/SolutionContext';
import { ScreenshotProvider } from '../contexts/ScreenshotContext';
import { AuthenticatedUser, SubscriptionLevel } from '../../shared/api';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';

interface SubscribedAppProps {
  user: AuthenticatedUser;
}

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

const SubscribedApp: React.FC<SubscribedAppProps> = ({ user }) => {
  const isFree = user.subscription.level === SubscriptionLevel.FREE;

  const subscriptionValue = useMemo(
    () => ({ user, isFree }),
    [user, isFree],
  );

  return (
    <SubscriptionProvider value={subscriptionValue}>
      <SettingsProvider>
        <SolutionProvider>
          <ScreenshotProvider>
            <SubscribedAppContent />
          </ScreenshotProvider>
        </SolutionProvider>
      </SettingsProvider>
    </SubscriptionProvider>
  );
};

export default SubscribedApp;

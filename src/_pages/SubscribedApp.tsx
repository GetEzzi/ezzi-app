import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import Queue from '../_pages/Queue';
import Solutions from '../_pages/Solutions';
import { useToast } from '../contexts/toast';
import { ProgrammingLanguage, UserLanguage } from '../../shared/api.ts';

interface SubscribedAppProps {
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  setLanguage: (language: ProgrammingLanguage) => void;
  setLocale: (language: UserLanguage) => void;
}

const SubscribedApp: React.FC<SubscribedAppProps> = ({
  currentLanguage,
  currentLocale,
  setLanguage,
  setLocale,
}) => {
  const queryClient = useQueryClient();
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
        ?.updateContentDimensions({ width, height })
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
        queryClient.removeQueries({
          queryKey: ['screenshots'],
        });
        queryClient.removeQueries({
          queryKey: ['solution'],
        });
        setView('queue');
      }),
      window.electronAPI.onResetView(() => {
        queryClient.removeQueries({
          queryKey: ['screenshots'],
        });
        queryClient.removeQueries({
          queryKey: ['solution'],
        });

        // Query cleanup
        const queryKeys = [
          'screenshots',
          'problem_statement',
          'solution',
          'new_solution',
        ];
        Promise.all(
          queryKeys.map((key) =>
            queryClient.invalidateQueries({
              queryKey: [key],
            }),
          ),
        ).catch(console.error);

        setView('queue');
      }),
      window.electronAPI.onSolutionError((error: string) => {
        showToast('Error', error, 'error');
      }),
    ];

    return () => cleanupFunctions.forEach((fn) => fn());
  }, [view]);

  return (
    <div ref={containerRef} className="min-h-0">
      {view === 'queue' ? (
        <Queue
          setView={setView}
          currentLanguage={currentLanguage}
          currentLocale={currentLocale}
          setLanguage={setLanguage}
          setLocale={setLocale}
        />
      ) : view === 'solutions' ? (
        <Solutions setView={setView} currentLanguage={currentLanguage} />
      ) : null}
    </div>
  );
};

export default SubscribedApp;

import { useEffect } from 'react';

interface UseScreenshotEventsOptions {
  onScreenshotTaken?: () => void;
  onResetView?: () => void;
  refetch?: () => void | Promise<unknown>;
}

export function useScreenshotEvents(options: UseScreenshotEventsOptions = {}) {
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    if (options.onScreenshotTaken || options.refetch) {
      cleanupFunctions.push(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.electronAPI.onScreenshotTaken(async () => {
          options.onScreenshotTaken?.();
          await options.refetch?.();
        }),
      );
    }

    if (options.onResetView || options.refetch) {
      cleanupFunctions.push(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.electronAPI.onResetView(async () => {
          options.onResetView?.();
          await options.refetch?.();
        }),
      );
    }

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [options.onScreenshotTaken, options.onResetView, options.refetch]);
}

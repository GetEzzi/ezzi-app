import { AllIpcEvents, IPC_EVENTS } from '@shared/constants.ts';

export const sendToElectron = (channel: AllIpcEvents, ...args: any[]) => {
  if (!window.electron) {
    return console.error('No Electron window available!');
  }

  switch (channel) {
    case IPC_EVENTS.TOOLTIP.MOUSE_ENTER:
      window.electronAPI.handleMouseEnter(args).catch(console.error);
      break;
    case IPC_EVENTS.TOOLTIP.MOUSE_LEAVE:
      window.electronAPI.handleMouseLeave(args).catch(console.error);
      break;
    case IPC_EVENTS.TOOLTIP.CLOSE_CLICK:
      window.electronAPI.handleCloseClick(args).catch(console.error);
      break;
    case IPC_EVENTS.QUEUE.LOADED_NO_SCREENSHOTS:
      window.electronAPI.handleQueueLoadedNoScreenshots();
      break;
    case IPC_EVENTS.QUEUE.LOADED_WITH_SCREENSHOTS:
      window.electronAPI.handleQueueLoadedWithScreenshots(args[0] as number);
      break;
  }
};

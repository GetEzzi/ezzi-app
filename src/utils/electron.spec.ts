jest.mock('../../shared/constants', () => ({
  isSelfHosted: jest.fn(() => false),
  API_BASE_URL: 'http://localhost:3000',
  IPC_EVENTS: {
    TOOLTIP: {
      MOUSE_ENTER: 'tooltip:mouse-enter',
      MOUSE_LEAVE: 'tooltip:mouse-leave',
      CLOSE_CLICK: 'tooltip:close-click',
    },
    QUEUE: {
      LOADED_NO_SCREENSHOTS: 'queue:loaded-no-screenshots',
      LOADED_WITH_SCREENSHOTS: 'queue:loaded-with-screenshots',
    },
    APP_MODE: {
      CHANGE: 'app-mode:change',
    },
  },
}));

import { IPC_EVENTS } from '../../shared/constants';
import { sendToElectron } from './electron';

describe('sendToElectron', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    window.electronAPI = {
      ...window.electronAPI,
      handleMouseEnter: jest.fn().mockResolvedValue(undefined),
      handleMouseLeave: jest.fn().mockResolvedValue(undefined),
      handleCloseClick: jest.fn().mockResolvedValue(undefined),
      handleQueueLoadedNoScreenshots: jest.fn(),
      handleQueueLoadedWithScreenshots: jest.fn(),
    } as any;
    (window as any).electron = { ipcRenderer: {} };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete (window as any).electron;
  });

  describe('TOOLTIP events', () => {
    test('WHEN MOUSE_ENTER channel is sent THEN handleMouseEnter is called', () => {
      // Act
      sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_ENTER, 'arg');

      // Assert
      expect(window.electronAPI.handleMouseEnter).toHaveBeenCalled();
    });

    test('WHEN MOUSE_LEAVE channel is sent THEN handleMouseLeave is called', () => {
      // Act
      sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_LEAVE);

      // Assert
      expect(window.electronAPI.handleMouseLeave).toHaveBeenCalled();
    });

    test('WHEN CLOSE_CLICK channel is sent THEN handleCloseClick is called', () => {
      // Act
      sendToElectron(IPC_EVENTS.TOOLTIP.CLOSE_CLICK);

      // Assert
      expect(window.electronAPI.handleCloseClick).toHaveBeenCalled();
    });
  });

  describe('QUEUE events', () => {
    test('WHEN LOADED_NO_SCREENSHOTS channel is sent THEN handler is called', () => {
      // Act
      sendToElectron(IPC_EVENTS.QUEUE.LOADED_NO_SCREENSHOTS);

      // Assert
      expect(window.electronAPI.handleQueueLoadedNoScreenshots).toHaveBeenCalled();
    });

    test('WHEN LOADED_WITH_SCREENSHOTS channel is sent THEN handler receives count', () => {
      // Act
      sendToElectron(IPC_EVENTS.QUEUE.LOADED_WITH_SCREENSHOTS, 3);

      // Assert
      expect(window.electronAPI.handleQueueLoadedWithScreenshots).toHaveBeenCalledWith(3);
    });
  });

  describe('missing electron bridge', () => {
    test('WHEN window.electron is missing THEN it logs an error and skips IPC', () => {
      delete (window as any).electron;

      // Act
      sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_ENTER);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('No Electron window available!');
      expect(window.electronAPI.handleMouseEnter).not.toHaveBeenCalled();
    });
  });
});

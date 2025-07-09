const getPlatform = () => {
  try {
    return window.electronAPI?.getPlatform() || 'win32';
  } catch {
    return 'win32';
  }
};

export const COMMAND_KEY = getPlatform() === 'darwin' ? '⌘' : 'Ctrl';

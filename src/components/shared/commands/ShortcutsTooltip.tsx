import React from 'react';
import { LanguageSelector } from '../LanguageSelector';
import { sendToElectron } from '../../../utils/electron';
import { IPC_EVENTS } from '@shared/constants.ts';
import { LocaleSelector } from '../LocaleSelector.tsx';
import { AppModeSelector } from '../AppModeSelector';
import { ProgrammingLanguage, UserLanguage, AppMode } from '@shared/api.ts';

export interface ShortcutItem {
  label: string;
  shortcut: string[];
  description: string;
  condition?: boolean;
}

interface ShortcutsTooltipProps {
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  shortcuts: ShortcutItem[];
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  currentAppMode: AppMode;
  setLanguage: (language: ProgrammingLanguage) => void;
  onSignOut: () => void;
  className?: string;
  setLocale: (language: UserLanguage) => void;
  setAppMode: (appMode: AppMode) => void;
}

const ShortcutsTooltip: React.FC<ShortcutsTooltipProps> = ({
  tooltipRef,
  shortcuts,
  currentLanguage,
  currentLocale,
  currentAppMode,
  setLanguage,
  onSignOut,
  className = '',
  setLocale,
  setAppMode,
}) => {
  return (
    <div
      ref={tooltipRef}
      className={`absolute text-[14px] top-full left-0 mt-2 w-80 transform -translate-x-[calc(50%-12px)] ${className}`}
      style={{ zIndex: 100 }}
    >
      <div className="absolute -top-2 right-0 w-full h-2" />
      <div className="p-3 text-xs bg-[#1E2530]/80 rounded-lg border border-gray-700 text-gray-100 shadow-lg">
        <div className="space-y-4">
          <h3 className="font-semibold truncate">Keyboard Shortcuts</h3>
          <div className="space-y-3">
            {shortcuts.map(
              (shortcut, index) =>
                shortcut.condition !== false && (
                  <div
                    key={index}
                    className="cursor-default rounded-sm px-2 py-1.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">
                        {shortcut.label}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {shortcut.shortcut.map((key, keyIndex) => (
                          <span
                            key={keyIndex}
                            className="bg-gray-700/50 px-1.5 py-0.5 rounded-sm text-[10px] leading-none font-medium"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed text-gray-400 truncate mt-1">
                      {shortcut.description}
                    </p>
                  </div>
                ),
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-gray-700">
            <AppModeSelector
              currentAppMode={currentAppMode}
              setAppMode={setAppMode}
            />

            <LanguageSelector
              currentLanguage={currentLanguage}
              currentLocale={currentLocale}
              setLanguage={setLanguage}
            />

            <LocaleSelector
              currentLanguage={currentLanguage}
              currentLocale={currentLocale}
              setLocale={setLocale}
            />

            <div className="flex items-center justify-between">
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                Log Out
              </button>
              <button
                onClick={() => sendToElectron(IPC_EVENTS.TOOLTIP.CLOSE_CLICK)}
                className="flex items-center gap-2 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsTooltip;

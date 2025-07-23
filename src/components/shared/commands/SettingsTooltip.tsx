import React, { useState, useEffect, useRef } from 'react';
import { ProgrammingLanguage, UserLanguage, AppMode } from '@shared/api.ts';
import GearIcon from './GearIcon';
import ShortcutsTooltip, { ShortcutItem } from './ShortcutsTooltip';
import { sendToElectron } from '../../../utils/electron.ts';
import { IPC_EVENTS } from '@shared/constants.ts';

interface SettingsTooltipProps {
  shortcuts: ShortcutItem[];
  currentLanguage: ProgrammingLanguage;
  currentLocale: UserLanguage;
  currentAppMode: AppMode;
  setLanguage: (language: ProgrammingLanguage) => void;
  onSignOut: () => void;
  onTooltipVisibilityChange: (visible: boolean, height: number) => void;
  setLocale: (language: UserLanguage) => void;
  setAppMode: (appMode: AppMode) => void;
}

const SettingsTooltip: React.FC<SettingsTooltipProps> = ({
  shortcuts,
  currentLanguage,
  currentLocale,
  currentAppMode,
  setLanguage,
  onSignOut,
  onTooltipVisibilityChange,
  setLocale,
  setAppMode,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tooltipHeight = 0;
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10;
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight);
  }, [isTooltipVisible, onTooltipVisibilityChange]);

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
    sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_ENTER);
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
    sendToElectron(IPC_EVENTS.TOOLTIP.MOUSE_LEAVE);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <GearIcon />
      {isTooltipVisible && (
        <ShortcutsTooltip
          tooltipRef={tooltipRef}
          shortcuts={shortcuts}
          currentLanguage={currentLanguage}
          currentLocale={currentLocale}
          currentAppMode={currentAppMode}
          setLanguage={setLanguage}
          setLocale={setLocale}
          setAppMode={setAppMode}
          onSignOut={onSignOut}
        />
      )}
    </div>
  );
};

export default SettingsTooltip;

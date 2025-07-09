import React from 'react';
import { COMMAND_KEY } from '../../../utils/platform';

interface CommandButtonProps {
  label: string;
  shortcut: string;
  description?: string;
}

const CommandButton: React.FC<CommandButtonProps> = ({
  label,
  shortcut,
  description,
}) => {
  return (
    <div className="flex items-center gap-2 cursor-default rounded-sm px-2 py-1.5 transition-colors">
      <span className="leading-none truncate">{label}</span>
      <div className="flex gap-1">
        <button className="bg-white/10 cursor-default rounded-md px-1.5 py-1 leading-none text-white/100">
          {COMMAND_KEY}
        </button>
        <button className="bg-white/10 cursor-default rounded-md px-1.5 py-1 leading-none text-white/100">
          {shortcut}
        </button>
      </div>
      {description && (
        <p className="text-[10px] leading-relaxed text-white/70 truncate mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

export default CommandButton;

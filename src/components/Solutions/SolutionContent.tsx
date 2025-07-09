import React from 'react';
import { ProgrammingLanguage } from '../../../shared/api';

interface SolutionContentProps {
  title: string;
  content: React.ReactNode;
  isLoading: boolean;
  currentLanguage?: ProgrammingLanguage;
  type?: 'code' | 'text';
}

const SolutionContent: React.FC<SolutionContentProps> = ({
  title,
  content,
  isLoading,
  type = 'text',
}) => {
  return (
    <div className="bg-[#1E2530]/80 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <h2 className="text-[13px] font-semibold text-white tracking-wide">
          {title}
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-4 flex">
          <p className="text-xs bg-linear-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
            Loading...
          </p>
        </div>
      ) : (
        <div
          className={`text-[13px] leading-[1.5] ${type === 'text' ? 'text-gray-100' : ''}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default SolutionContent;

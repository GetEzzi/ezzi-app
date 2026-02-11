import React, { ReactNode } from 'react';

interface LiveInterviewLayoutProps {
  screenshotSection?: ReactNode;
  commandSection?: ReactNode;
  solutionSection?: ReactNode;
  className?: string;
}

export const LiveInterviewLayout: React.FC<LiveInterviewLayoutProps> = ({
  screenshotSection,
  commandSection,
  solutionSection,
  className = '',
}) => {
  return (
    <div className={`relative space-y-3 px-4 py-3 ${className}`}>
      {screenshotSection && <div className="w-fit">{screenshotSection}</div>}

      {commandSection && <div className="w-full">{commandSection}</div>}

      {solutionSection && (
        <div className="w-full space-y-4">{solutionSection}</div>
      )}
    </div>
  );
};

import React, { ReactNode } from 'react';

interface LeetcodeSolverLayoutProps {
  screenshotSection?: ReactNode;
  commandSection?: ReactNode;
  solutionSection?: ReactNode;
  className?: string;
}

export const LeetcodeSolverLayout: React.FC<LeetcodeSolverLayoutProps> = ({
  screenshotSection,
  commandSection,
  solutionSection,
  className = '',
}) => {
  return (
    <div className={`px-4 py-2 space-y-2 ${className}`}>
      {screenshotSection && <div className="w-fit">{screenshotSection}</div>}

      {commandSection && <div className="w-full">{commandSection}</div>}

      {solutionSection && (
        <div className="w-full space-y-3">{solutionSection}</div>
      )}
    </div>
  );
};

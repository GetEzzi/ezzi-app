import React from 'react';

interface ThoughtsListProps {
  thoughts: string[];
}

const ThoughtsList: React.FC<ThoughtsListProps> = ({ thoughts }) => {
  return (
    <div className="space-y-2">
      {thoughts.map((thought, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
          <div className="text-gray-100">{thought}</div>
        </div>
      ))}
    </div>
  );
};

export default ThoughtsList;

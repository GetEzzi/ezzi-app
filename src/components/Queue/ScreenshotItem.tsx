import React from 'react';
import { X } from 'lucide-react';

interface Screenshot {
  path: string;
  preview: string;
}

interface ScreenshotItemProps {
  screenshot: Screenshot;
  onDelete: (index: number) => Promise<void>;
  index: number;
  isLoading: boolean;
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = ({
  screenshot,
  onDelete,
  index,
  isLoading,
}) => {
  const handleDelete = () => {
    onDelete(index).catch(console.error);
  };

  return (
    <>
      <div
        className={`relative w-[128px] h-[72px] rounded-lg overflow-hidden ring-1 ring-[#1E2530]/80 ${
          isLoading ? '' : 'group'
        }`}
      >
        <div className="w-full h-full relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={screenshot.preview}
            alt="Screenshot"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isLoading
                ? 'opacity-50'
                : 'cursor-pointer group-hover:scale-105 group-hover:brightness-75'
            }`}
          />
        </div>
        {!isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="absolute top-2 left-2 p-1 rounded-full bg-[#1E2530]/80 text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-white"
            aria-label="Delete screenshot"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </>
  );
};

export default ScreenshotItem;

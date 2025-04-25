import React, { useEffect, useState } from 'react';

interface GuideModalProps {
  imagePath: string;
  title: string;
  content: string | React.ReactNode;
  onClose: () => void;
  isNootPro?: boolean;
}

const GuideModal: React.FC<GuideModalProps> = ({ 
  imagePath, 
  title, 
  content, 
  onClose,
  isNootPro = false 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(isNootPro ? 0 : 5);
  
  useEffect(() => {
    if (!isNootPro && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isNootPro]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-[#3a2518] border-4 border-[#6b4423] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-300">{title}</h2>
        </div>
        
        <div className="mb-6 flex justify-center">
          <img 
            src={imagePath} 
            alt={`${title} Guide`} 
            className="max-w-full rounded-lg border-2 border-[#6b4423]"
          />
        </div>
        
        <div className="text-lg text-white">
          {content}
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            disabled={!isNootPro && timeRemaining > 0}
            className={`px-6 py-2 rounded-lg font-bold ${
              !isNootPro && timeRemaining > 0
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
            }`}
          >
            {!isNootPro && timeRemaining > 0
              ? `Continue (${timeRemaining}s)`
              : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal; 
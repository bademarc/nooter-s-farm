import React, { useState } from 'react';
import { useGuideContext } from '../context/guide-context';

const DevTools: React.FC = () => {
  const { resetAllGuides, setNootProStatus, isNootPro } = useGuideContext();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 right-2 bg-gray-800 text-white opacity-50 hover:opacity-100 rounded-full w-8 h-8 flex items-center justify-center z-50"
        title="Dev Tools"
      >
        🛠️
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 right-2 bg-gray-800 text-white p-4 rounded-lg z-50 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Developer Tools</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={resetAllGuides}
          className="w-full px-3 py-1 bg-red-700 hover:bg-red-600 rounded"
        >
          Reset All Guides
        </button>
        
        <div className="flex items-center justify-between">
          <span>Noot Pro Status:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isNootPro}
              onChange={(e) => setNootProStatus(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DevTools; 
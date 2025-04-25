import React, { createContext, ReactNode } from 'react';
import { useGuides } from '../hooks/useGuides';

// Define the context type
type GuideContextType = ReturnType<typeof useGuides>;

// Create the context with a default value
export const GuideContext = createContext<GuideContextType | undefined>(undefined);

// Create the provider component
interface GuideProviderProps {
  children: ReactNode;
}

export const GuideProvider: React.FC<GuideProviderProps> = ({ children }) => {
  const guideUtils = useGuides();
  
  return (
    <GuideContext.Provider value={guideUtils}>
      {children}
    </GuideContext.Provider>
  );
};

// Create a hook for using this context
export const useGuideContext = () => {
  const context = React.useContext(GuideContext);
  
  if (context === undefined) {
    throw new Error('useGuideContext must be used within a GuideProvider');
  }
  
  return context;
}; 
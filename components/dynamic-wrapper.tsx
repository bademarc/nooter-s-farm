'use client';

import { useState, useEffect, ReactNode } from 'react';

interface DynamicWrapperProps {
  children: ReactNode;
}

/**
 * DynamicWrapper ensures content is only rendered on the client side
 * This helps prevent "document is not defined" errors during server rendering
 */
export default function DynamicWrapper({ children }: DynamicWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During server-side rendering, return null to avoid any document access
  if (!isMounted) {
    return null;
  }
  
  // Once mounted on the client, render the children
  return <>{children}</>;
} 
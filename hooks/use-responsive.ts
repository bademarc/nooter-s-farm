import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design similar to react-native-responsive-screen
 * but implemented for web/Next.js
 */
export const useResponsive = () => {
  // Set initial dimensions to prevent SSR issues
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Update dimensions when window is resized
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set up event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Convert width percentage to pixels
   * @param widthPercent string | number - percentage of screen width (e.g., '20%' or 20)
   * @returns number - calculated width in pixels
   */
  const widthPercentageToDP = (widthPercent: string | number): number => {
    // Convert string input with % to number
    const elemWidth = typeof widthPercent === 'string' 
      ? parseFloat(widthPercent.replace(/%$/, ''))
      : widthPercent;
    
    return (dimensions.width * elemWidth) / 100;
  };

  /**
   * Convert height percentage to pixels
   * @param heightPercent string | number - percentage of screen height (e.g., '20%' or 20)
   * @returns number - calculated height in pixels
   */
  const heightPercentageToDP = (heightPercent: string | number): number => {
    // Convert string input with % to number
    const elemHeight = typeof heightPercent === 'string'
      ? parseFloat(heightPercent.replace(/%$/, ''))
      : heightPercent;
      
    return (dimensions.height * elemHeight) / 100;
  };

  /**
   * Convert a design size value to a responsive value based on screen width
   * @param size number - size in pixels from design
   * @param designWidth number - width of the design (default: 1920)
   * @returns number - calculated responsive size
   */
  const responsiveWidth = (size: number, designWidth: number = 1920): number => {
    return dimensions.width * (size / designWidth);
  };

  /**
   * Convert a design size value to a responsive value based on screen height
   * @param size number - size in pixels from design
   * @param designHeight number - height of the design (default: 1080)
   * @returns number - calculated responsive size
   */
  const responsiveHeight = (size: number, designHeight: number = 1080): number => {
    return dimensions.height * (size / designHeight);
  };

  /**
   * Check if the current viewport is mobile-sized
   * @param breakpoint number - breakpoint for mobile width (default: 768px)
   * @returns boolean - true if viewport width is less than or equal to breakpoint
   */
  const isMobile = (breakpoint: number = 768): boolean => {
    return dimensions.width <= breakpoint;
  };

  /**
   * Get current viewport dimensions
   * @returns object with width and height properties
   */
  const getViewportDimensions = () => dimensions;

  return {
    widthPercentageToDP,
    heightPercentageToDP,
    responsiveWidth,
    responsiveHeight,
    isMobile,
    getViewportDimensions,
    width: dimensions.width,
    height: dimensions.height,
  };
};

// For direct import without using the hook
export const widthPercentageToDP = (widthPercent: string | number): number => {
  if (typeof window === 'undefined') return 0;
  
  const elemWidth = typeof widthPercent === 'string' 
    ? parseFloat(widthPercent.replace(/%$/, ''))
    : widthPercent;
  
  return (window.innerWidth * elemWidth) / 100;
};

export const heightPercentageToDP = (heightPercent: string | number): number => {
  if (typeof window === 'undefined') return 0;
  
  const elemHeight = typeof heightPercent === 'string'
    ? parseFloat(heightPercent.replace(/%$/, ''))
    : heightPercent;
    
  return (window.innerHeight * elemHeight) / 100;
};

// Common shorthand aliases
export const wp = widthPercentageToDP;
export const hp = heightPercentageToDP; 
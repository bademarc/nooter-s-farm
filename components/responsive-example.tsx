"use client";

import { useResponsive, wp, hp } from "../hooks/use-responsive";

export function ResponsiveExample() {
  // Use the hook to get all responsive utilities
  const { 
    widthPercentageToDP, 
    heightPercentageToDP,
    responsiveWidth,
    responsiveHeight,
    isMobile,
    width,
    height
  } = useResponsive();

  // You can also use the direct imports (wp, hp) for simpler components
  // The hook is better for components that need multiple responsive values
  // or that need to respond to window resizing

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Responsive Design Examples</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Using the hook methods */}
        <div 
          style={{ 
            width: widthPercentageToDP(80), 
            height: heightPercentageToDP(20),
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            padding: '16px',
            color: 'white'
          }}
        >
          <p>Using hook methods</p>
          <p>Width: {width}px (80% = {widthPercentageToDP(80).toFixed(0)}px)</p>
          <p>Height: {height}px (20% = {heightPercentageToDP(20).toFixed(0)}px)</p>
        </div>
        
        {/* Using the direct import functions */}
        <div 
          style={{ 
            width: wp(80), 
            height: hp(20),
            backgroundColor: '#7c3aed',
            borderRadius: '8px',
            padding: '16px',
            color: 'white'
          }}
        >
          <p>Using direct imports (wp, hp)</p>
          <p>Width: {width}px (80% = {wp(80).toFixed(0)}px)</p>
          <p>Height: {height}px (20% = {hp(20).toFixed(0)}px)</p>
        </div>
      </div>
      
      {/* Responsive sizing from a design spec */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-2">Design-Based Responsive Sizing</h3>
        <div 
          style={{ 
            width: responsiveWidth(500), 
            height: responsiveHeight(300),
            backgroundColor: '#059669',
            borderRadius: '8px',
            padding: '16px',
            color: 'white',
            marginTop: '12px'
          }}
        >
          <p>This box is scaled from a design spec (500px × 300px at 1920 × 1080)</p>
          <p>Current dimensions: {responsiveWidth(500).toFixed(0)}px × {responsiveHeight(300).toFixed(0)}px</p>
        </div>
      </div>
      
      {/* Responsive design state indicator */}
      <div 
        className="mt-6 p-4 rounded-lg" 
        style={{ backgroundColor: isMobile() ? '#f87171' : '#34d399' }}
      >
        <p className="font-bold text-white">
          Current viewport is: {isMobile() ? 'Mobile' : 'Desktop'} ({width}px × {height}px)
        </p>
      </div>
    </div>
  );
} 
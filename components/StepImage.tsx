import React, { useState, useEffect } from 'react';
import { Image, Sparkles } from 'lucide-react';

interface StepImageProps {
  imagePath: string;
  stepIndex: number;
  guideType: string;
  active: boolean;
}

const StepImage: React.FC<StepImageProps> = ({ 
  imagePath,
  stepIndex,
  guideType,
  active
}) => {
  const [loaded, setLoaded] = useState(false);
  const [sparkles, setSparkles] = useState<{left: string, top: string, size: number}[]>([]);
  
  // Generate base image path from the guide image
  // This assumes we'll create step-specific images like farm_step1.jpg, farm_step2.jpg, etc.
  const basePath = imagePath.replace('.jpg', '');
  const stepImagePath = `${basePath}_step${stepIndex + 1}.jpg`;
  // Fallback to main image if step image doesn't exist
  const finalImagePath = imagePath;
  
  useEffect(() => {
    if (active) {
      // Generate random sparkles when active
      const newSparkles = Array.from({ length: 3 }, () => ({
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
        size: Math.floor(Math.random() * 10) + 5
      }));
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [active]);
  
  return (
    <div className={`relative rounded-lg overflow-hidden transition-all duration-500 ${
      active ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
    }`}>
      <div className={`w-full aspect-video bg-[#222] rounded-lg relative ${!loaded && 'animate-pulse'}`}>
        {/* Main image */}
        <img 
          src={finalImagePath}
          alt={`${guideType} guide step ${stepIndex + 1}`}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
        />
        
        {/* Loading placeholder */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="w-6 h-6 text-white/40 animate-pulse" />
          </div>
        )}
        
        {/* Step number indicator */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
          <span className="text-white font-medium">{stepIndex + 1}</span>
        </div>
        
        {/* Visual effects for active image */}
        {active && loaded && (
          <>
            {/* Border glow */}
            <div className="absolute inset-0 border-2 border-white/20 rounded-lg pulse-glow"></div>
            
            {/* Sparkle effects */}
            {sparkles.map((sparkle, i) => (
              <div 
                key={i}
                className="absolute"
                style={{
                  left: sparkle.left,
                  top: sparkle.top,
                  zIndex: 10
                }}
              >
                <Sparkles 
                  className="text-white animate-pulse" 
                  style={{ 
                    width: `${sparkle.size}px`, 
                    height: `${sparkle.size}px`,
                    animationDelay: `${i * 0.3}s`
                  }} 
                />
              </div>
            ))}
            
            {/* Highlight gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default StepImage; 
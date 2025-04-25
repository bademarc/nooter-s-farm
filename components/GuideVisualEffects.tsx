import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SparkleProps {
  top: string;
  left: string;
  size: number;
  delay: number;
}

const SparkleEffect: React.FC<SparkleProps> = ({ top, left, size, delay }) => {
  return (
    <div 
      className="absolute animate-float" 
      style={{ 
        top, 
        left, 
        animationDelay: `${delay}s`,
        opacity: 0.7
      }}
    >
      <Sparkles 
        className="text-white" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px` 
        }}
      />
    </div>
  );
};

interface GlowDotProps {
  top: string;
  left: string;
  size: number;
  delay: number;
  color?: string;
}

const GlowDot: React.FC<GlowDotProps> = ({ top, left, size, delay, color = 'white' }) => {
  return (
    <div 
      className="absolute rounded-full pulse-glow" 
      style={{ 
        top, 
        left, 
        width: `${size}px`, 
        height: `${size}px`, 
        backgroundColor: color,
        animationDelay: `${delay}s`,
        opacity: 0.4
      }}
    />
  );
};

interface GuideVisualEffectsProps {
  guideType: string;
}

const GuideVisualEffects: React.FC<GuideVisualEffectsProps> = ({ guideType }) => {
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);
  const [glowDots, setGlowDots] = useState<GlowDotProps[]>([]);
  
  useEffect(() => {
    // Generate random sparkles
    const newSparkles = Array.from({ length: 5 }, (_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.floor(Math.random() * 10) + 5,
      delay: Math.random() * 2
    }));
    
    // Generate random glow dots
    const newGlowDots = Array.from({ length: 3 }, (_, i) => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.floor(Math.random() * 15) + 5,
      delay: Math.random() * 2,
      color: 'white'
    }));
    
    setSparkles(newSparkles);
    setGlowDots(newGlowDots);
  }, [guideType]);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((sparkle, index) => (
        <SparkleEffect key={`sparkle-${index}`} {...sparkle} />
      ))}
      
      {glowDots.map((dot, index) => (
        <GlowDot key={`dot-${index}`} {...dot} />
      ))}
    </div>
  );
};

export default GuideVisualEffects; 
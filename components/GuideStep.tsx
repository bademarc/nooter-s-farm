import React from 'react';
import { Sparkles, CheckCircle, AlertTriangle, Info, TrendingUp, Star } from 'lucide-react';

interface GuideStepProps {
  index: number;
  title: string;
  description: string;
  icon?: 'sparkles' | 'check' | 'alert' | 'info' | 'trending' | 'star';
  isActive?: boolean;
}

const GuideStep: React.FC<GuideStepProps> = ({
  index,
  title,
  description,
  icon = 'sparkles',
  isActive = false,
}) => {
  const iconMap = {
    sparkles: <Sparkles className="h-5 w-5 text-white" />,
    check: <CheckCircle className="h-5 w-5 text-white" />,
    alert: <AlertTriangle className="h-5 w-5 text-white" />,
    info: <Info className="h-5 w-5 text-white" />,
    trending: <TrendingUp className="h-5 w-5 text-white" />,
    star: <Star className="h-5 w-5 text-white" />
  };

  return (
    <div 
      className={`
        relative p-4 border border-[#333] rounded-lg mb-4 transition-all
        ${isActive 
          ? 'bg-[#222] shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
          : 'bg-[#111] opacity-80 hover:opacity-100'
        }
      `}
    >
      <div className="flex items-start">
        <div className={`
          w-10 h-10 flex-shrink-0 rounded-lg border border-[#333] 
          flex items-center justify-center mr-4
          ${isActive ? 'bg-white/10' : 'bg-[#222]'}
          transition-all duration-300
        `}>
          {iconMap[icon]}
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1 flex items-center">
            <span className="mr-2">{title}</span>
            {isActive && (
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
            )}
          </h3>
          <p className="text-white/60 text-sm">{description}</p>
        </div>
        
        <div className="w-6 text-center text-white/40 font-medium ml-2">
          {index}
        </div>
      </div>
      
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" 
            style={{ transform: 'translateX(-100%)', animation: 'shimmer 2s infinite linear' }}></div>
        </div>
      )}
    </div>
  );
};

export default GuideStep; 
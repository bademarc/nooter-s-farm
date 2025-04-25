import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, ChevronLeft, ChevronRight, Check, Star, Image } from 'lucide-react';
import GuideVisualEffects from './GuideVisualEffects';

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
  const [step, setStep] = useState(0);
  const [animateSparkle, setAnimateSparkle] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Parse content as steps if it's a div with ol
  const contentElement = typeof content === 'string' ? null : content as React.ReactElement;
  const contentItems = contentElement?.props?.children?.find((child: any) => 
    child?.type === 'ol'
  )?.props?.children || [];
  
  const totalSteps = contentItems.length > 0 ? contentItems.length + 1 : 1;
  
  useEffect(() => {
    if (!isNootPro && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isNootPro]);
  
  useEffect(() => {
    // Add entrance animation to modal
    if (modalRef.current) {
      modalRef.current.classList.add('guide-modal-enter');
    }
    
    // Add hover effect to image
    if (imageRef.current) {
      imageRef.current.addEventListener('mousemove', handleImageHover);
      
      return () => {
        if (imageRef.current) {
          imageRef.current.removeEventListener('mousemove', handleImageHover);
        }
      };
    }
    
    // Trigger sparkle animation every 3 seconds
    const sparkleInterval = setInterval(() => {
      setAnimateSparkle(true);
      setTimeout(() => setAnimateSparkle(false), 2000);
    }, 5000);
    
    return () => clearInterval(sparkleInterval);
  }, []);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleImageHover = (e: MouseEvent) => {
    if (!imageRef.current) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    const moveX = (x - 0.5) * 10;
    const moveY = (y - 0.5) * 10;
    
    imageRef.current.style.transform = `perspective(1000px) rotateY(${moveX}deg) rotateX(${-moveY}deg) scale(1.05)`;
  };
  
  const handleImageLeave = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
    }
    setImageHover(false);
  };
  
  const handleImageEnter = () => {
    setImageHover(true);
  };
  
  const handleCloseModal = () => {
    setIsClosing(true);
    if (modalRef.current) {
      modalRef.current.classList.add('animate-fadeOut');
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };
  
  const handleNextStep = () => {
    if (step < totalSteps - 1) {
      setStep(prevStep => prevStep + 1);
    } else {
      handleCloseModal();
    }
  };
  
  const handlePrevStep = () => {
    if (step > 0) {
      setStep(prevStep => prevStep - 1);
    }
  };
  
  const renderContent = () => {
    // If using our EnhancedGuideContent component, just render it
    if (typeof content !== 'string' && !contentItems.length) {
      return content;
    }
    
    if (contentItems.length === 0 || step === 0) {
      // Show the intro step with image
      return (
        <>
          <div className="relative mb-6 flex justify-center overflow-hidden rounded-lg border border-[#222] bg-black group">
            <div className={`w-full h-auto aspect-video relative ${!imageLoaded ? 'animate-pulse bg-[#222]' : ''}`}>
              <img 
                ref={imageRef}
                src={imagePath} 
                alt={`${title} Guide`} 
                className={`max-w-full h-auto object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transformStyle: 'preserve-3d' }}
                onMouseLeave={handleImageLeave}
                onMouseEnter={handleImageEnter}
                onLoad={handleImageLoad}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="w-8 h-8 text-white/40 animate-pulse" />
                </div>
              )}
              
              {/* Image overlay effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
              
              {/* Hover sparkle effects */}
              {imageHover && imageLoaded && (
                <>
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute top-3/4 left-2/3 w-2 h-2 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute top-1/3 left-3/4 w-1.5 h-1.5 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.8s' }}></div>
                </>
              )}
              
              {/* Image border glow effect on hover */}
              <div className={`absolute inset-0 border-2 border-transparent transition-all duration-300 rounded-lg ${imageHover && imageLoaded ? 'border-white/20 pulse-glow' : ''}`}></div>
              
              {/* Image caption */}
              <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                <h3 className="text-lg font-bold flex items-center">
                  {title}
                  <Star className={`h-4 w-4 ml-2 transition-all duration-300 ${imageHover && imageLoaded ? 'opacity-100 text-white animate-pulse' : 'opacity-0'}`} />
                </h3>
                <p className="text-sm text-white/60 flex items-center">
                  <span>Scroll through guide</span>
                  <ChevronRight className="h-3 w-3 ml-1 animate-pulse" />
                </p>
              </div>
            </div>
          </div>
          {contentElement?.props?.children?.find((child: any) => child?.type === 'p')}
        </>
      );
    } else {
      // Show the step content
      const stepContent = contentItems[step - 1];
      return (
        <div className="p-4 bg-[#111] border border-[#333] rounded-lg animate-fadeIn">
          <div className="flex items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#222] mr-4 border border-[#333] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">{step}</span>
            </div>
            <div>
              {stepContent}
            </div>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
    >
      <div 
        ref={modalRef}
        className="bg-[#111] border border-[#333] rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
      >
        <GuideVisualEffects guideType={title.toLowerCase()} />
        
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Sparkles 
              className={`h-5 w-5 mr-2 text-white ${animateSparkle ? 'animate-pulse' : ''}`} 
            />
            {title}
          </h2>
          <button 
            onClick={handleCloseModal}
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-[#222] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress dots */}
        <div className="flex justify-center mb-4 space-x-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-white w-4' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="text-white mb-6">
          {renderContent()}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handlePrevStep}
            disabled={step === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              step === 0 
                ? 'bg-[#222] text-white/30 cursor-not-allowed' 
                : 'bg-[#222] text-white hover:bg-[#333]'
            }`}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={!isNootPro && timeRemaining > 0}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
              !isNootPro && timeRemaining > 0
                ? 'bg-[#222] text-white/60 cursor-not-allowed'
                : 'bg-white text-black hover:bg-white/90 btn-shimmer'
            }`}
          >
            {step === totalSteps - 1 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                {!isNootPro && timeRemaining > 0 ? `Got it (${timeRemaining}s)` : 'Got it!'}
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal; 
import React, { useState, useEffect } from 'react';
import GuideStep from './GuideStep';
import GuideVisualEffects from './GuideVisualEffects';
import StepImage from './StepImage';
import { Sparkles, Sprout, Coins, Clock, CheckCircle, ShoppingBag, Award, ChevronRight, ArrowRight, Image } from 'lucide-react';

interface EnhancedGuideContentProps {
  guideType: 'farm' | 'quests' | 'swap' | 'social' | 'profile' | 'defend' | 'platformer';
  imagePath: string;
}

const EnhancedGuideContent: React.FC<EnhancedGuideContentProps> = ({ guideType, imagePath }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showStepImages, setShowStepImages] = useState(false);
  
  useEffect(() => {
    // Show reward animation when viewing the last step
    if (guideContent[guideType].steps && activeStep === guideContent[guideType].steps.length - 1) {
      const timer = setTimeout(() => {
        setShowReward(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowReward(false);
    }
  }, [activeStep, guideType]);
  
  // Switch to showing step images after main image loads
  useEffect(() => {
    if (imageLoaded) {
      const timer = setTimeout(() => {
        setShowStepImages(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);
  
  const guideContent = {
    farm: {
      intro: "Farming is the core of Nooter's Farm. Follow these steps to grow your farm:",
      steps: [
        {
          title: "Buy Seeds",
          description: "Purchase seeds from the Market tab using Farm Coins.",
          icon: "sparkles"
        },
        {
          title: "Select & Plant",
          description: "Choose a seed from the 'Seed Selector' panel and click an empty plot on your farm.",
          icon: "check"
        },
        {
          title: "Wait for Growth",
          description: "Each crop has a growth time, influenced by Season and Weather. Monitor growing plots and apply Boosters.",
          icon: "trending"
        },
        {
          title: "Harvest",
          description: "Once a crop is ready (indicated by a checkmark ✓), click to harvest it into your inventory.",
          icon: "star"
        },
        {
          title: "Sell Crops",
          description: "Sell your harvested crops in the Market tab for Farm Coins 🪙.",
          icon: "trending"
        }
      ]
    },
    quests: {
      intro: "Quests are special tasks that reward you with Farm Coins when completed:",
      steps: [
        {
          title: "Daily Quests",
          description: "Reset every 24 hours. Complete them daily for steady coin rewards.",
          icon: "sparkles"
        },
        {
          title: "Weekly Quests",
          description: "More challenging but offer higher rewards. Reset every 7 days.",
          icon: "trending"
        },
        {
          title: "Track Progress",
          description: "Each quest shows a progress bar indicating how close you are to completion.",
          icon: "info"
        },
        {
          title: "Claim Rewards",
          description: "Once a quest is complete, claim your Farm Coin reward by clicking on it.",
          icon: "check"
        },
        {
          title: "Strategic Planning",
          description: "Plan your farming activities around quests to maximize your earnings!",
          icon: "star"
        }
      ]
    },
    swap: {
      intro: "Swap your tokens and manage your crypto assets:",
      steps: [
        {
          title: "Select Tokens",
          description: "Choose which token you want to swap from and to.",
          icon: "info"
        },
        {
          title: "Enter Amount",
          description: "Input the amount you want to swap or use the MAX button.",
          icon: "trending"
        },
        {
          title: "Review Rate",
          description: "Check the exchange rate and fees before confirming.",
          icon: "alert"
        },
        {
          title: "Confirm Swap",
          description: "Approve the transaction and wait for confirmation.",
          icon: "check"
        },
        {
          title: "Track History",
          description: "View your swap history and transaction details.",
          icon: "info"
        }
      ]
    },
    social: {
      intro: "Connect with other farmers in the Nooter community:",
      steps: [
        {
          title: "Friends",
          description: "Add other farmers to your friends list to visit their farms.",
          icon: "sparkles"
        },
        {
          title: "Leaderboards",
          description: "See who has the most impressive farm stats and try to climb the rankings.",
          icon: "trending"
        },
        {
          title: "Messages",
          description: "Chat with other farmers to exchange tips and tricks.",
          icon: "info"
        },
        {
          title: "Gifts",
          description: "Send and receive daily gifts to help each other's farms grow.",
          icon: "star"
        },
        {
          title: "Events",
          description: "Participate in community farming events for special rewards.",
          icon: "alert"
        }
      ]
    },
    profile: {
      intro: "Customize your profile and track your progress:",
      steps: [
        {
          title: "Nickname",
          description: "Set your farmer name for others to see.",
          icon: "info"
        },
        {
          title: "Bio",
          description: "Share a short description about yourself or your farm.",
          icon: "info"
        },
        {
          title: "Level",
          description: "Your farmer level increases as you gain XP from farming activities.",
          icon: "trending"
        },
        {
          title: "Statistics",
          description: "View your farming accomplishments, including crops harvested and coins earned.",
          icon: "trending"
        },
        {
          title: "Achievements",
          description: "Unlock special badges by completing farming milestones.",
          icon: "star"
        }
      ]
    },
    defend: {
      intro: "Protect your crops from waves of hungry enemies:",
      steps: [
        {
          title: "Defenses",
          description: "Place Ice Mage Asbter, Fire Mage Noot, Wizard Abster, and Cool Noot with cannon to stop enemies.",
          icon: "alert"
        },
        {
          title: "Enemies",
          description: "Different enemies have different speeds, health, and weaknesses.",
          icon: "alert"
        },
        {
          title: "Waves",
          description: "Face increasingly difficult waves of enemies as you progress.",
          icon: "trending"
        },
        {
          title: "Strategy",
          description: "Position your defenses strategically to maximize coverage.",
          icon: "info"
        },
        {
          title: "Rewards",
          description: "Earn Farm Coins based on your performance and waves survived.",
          icon: "star"
        }
      ]
    },
    platformer: {
      intro: "Play the Nooter Platformer game to earn extra Farm Coins:",
      steps: [
        {
          title: "Controls",
          description: "Use arrow keys or WASD to move, space to jump.",
          icon: "info"
        },
        {
          title: "Objective",
          description: "Collect coins and reach the end of each level.",
          icon: "check"
        },
        {
          title: "Power-ups",
          description: "Find special items that give you temporary abilities.",
          icon: "star"
        },
        {
          title: "Enemies",
          description: "Avoid or defeat creatures that try to stop you.",
          icon: "alert"
        },
        {
          title: "Rewards",
          description: "Convert your in-game score to Farm Coins at the end of each level.",
          icon: "trending"
        }
      ]
    }
  };
  
  const content = guideContent[guideType];
  
  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  return (
    <div className="relative">
      <GuideVisualEffects guideType={guideType} />
      
      <div className="grid grid-cols-1 gap-6">
        <div>
          {/* Main Featured Image - shown initially */}
          <div className={`relative mb-6 overflow-hidden rounded-lg transition-all duration-500 ${showStepImages ? 'opacity-0 h-0' : 'opacity-100'}`}>
            <div className={`w-full h-auto aspect-video relative ${!imageLoaded ? 'animate-pulse bg-[#222]' : ''}`}>
              <img 
                src={imagePath} 
                alt={`${guideType} Guide`} 
                className={`w-full h-auto object-cover rounded-lg border border-[#333] transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={handleImageLoad}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="w-8 h-8 text-white/40 animate-pulse" />
                </div>
              )}
            </div>
          </div>
          
          {/* Step-specific images - fade in after main image loads */}
          {showStepImages && (
            <div className="mb-6 grid gap-4">
              <StepImage 
                imagePath={imagePath}
                stepIndex={activeStep}
                guideType={guideType}
                active={true}
              />
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              <p className="text-white text-sm">{content.intro}</p>
            </div>
            
            {/* Next step hint */}
            {activeStep < content.steps.length - 1 && (
              <div className="text-white/40 text-xs flex items-center mt-2 animate-pulse">
                <span>Click on steps to learn more</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="relative">
            {/* Progress indicator */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#222]"></div>
            <div 
              className="absolute left-5 top-5 w-0.5 bg-white" 
              style={{ 
                height: `${(activeStep + 1) * 100 / content.steps.length}%`,
                transition: 'height 0.5s ease-out'
              }}
            ></div>
            
            {/* Steps */}
            <div className="space-y-4 ml-0.5">
              {content.steps.map((step, index) => (
                <div 
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    index > activeStep ? 'opacity-60 hover:opacity-80' : ''
                  } ${index === activeStep ? 'guide-step-enter' : ''}`}
                  onClick={() => handleStepClick(index)}
                >
                  <GuideStep
                    index={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon as any}
                    isActive={activeStep === index}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Reward animation */}
      {showReward && (
        <div className="mt-8 p-4 bg-[#222] border border-[#444] rounded-lg shadow-lg relative overflow-hidden reward-pop">
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-white mr-3 animate-pulse" />
              <div>
                <h3 className="text-white font-bold">You've mastered the basics!</h3>
                <p className="text-white/60 text-sm">Now go apply your knowledge</p>
              </div>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <span className="text-white font-bold ml-1">+50</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Action button only shown on last step */}
      {activeStep === content.steps.length - 1 && (
        <div className="mt-4 flex justify-center">
          <button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center btn-shimmer overflow-hidden">
            <Sparkles className="h-4 w-4 mr-2" />
            Start playing now!
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedGuideContent; 
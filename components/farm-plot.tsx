"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import growingAnimation from "../public/animations/growing.json";
import readyCarrot from "../public/animations/carrot.json";
import readyAubergine from "../public/animations/aubergine.json";
import readyPear from "../public/animations/pear.json";
import readyBroccoli from "../public/animations/Broccoli .json";
import readyCorn from "../public/animations/Corn .json";
import readyTomato from "../public/animations/Dometos .json";
import readyRadish from "../public/animations/radish .json";
import readyZucchini from "../public/animations/Zucchini .json";
import { Button } from "@/components/ui/button";
import { Sprout, Scissors, Sparkles } from "lucide-react";

interface FarmPlotProps {
  plot: {
    status: "empty" | "growing" | "ready";
    crop: string | null;
    plantedAt: number | null;
    readyAt: number | null;
  };
  onPlant: () => void;
  onHarvest: () => void;
  id?: string;
}

export const FarmPlot = ({ plot, onPlant, onHarvest, id }: FarmPlotProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [growthProgress, setGrowthProgress] = useState(0);
  
  // Time calculation effect
  useEffect(() => {
    if (plot.status !== "growing" || !plot.readyAt || !plot.plantedAt) return;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const totalGrowTime = plot.readyAt! - plot.plantedAt!;
      const timeElapsed = now - plot.plantedAt!;
      const secondsLeft = Math.max(0, Math.round((plot.readyAt! - now) / 1000));
      
      // Calculate progress for visual indicators (0-100)
      const progress = Math.min(100, Math.max(0, (timeElapsed / totalGrowTime) * 100));
      setGrowthProgress(progress);
      
      // Format time remaining
      if (secondsLeft <= 0) {
        setTimeLeft("Ready!");
        clearInterval(timer);
      } else if (secondsLeft < 60) {
        setTimeLeft(`${secondsLeft}s`);
      } else {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [plot.status, plot.readyAt, plot.plantedAt]);

  // Plot style classes based on status
  const getPlotClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-300";
    
    switch(plot.status) {
      case "empty":
        return `${baseClasses} bg-black`;
      case "growing":
        return `${baseClasses} bg-black`;
      case "ready":
        return `${baseClasses} bg-black`;
      default:
        return baseClasses;
    }
  };

  const getCropAnimation = () => {
    if (plot.status === "empty") return null;
    
    const style = {
      width: "60px", 
      height: "60px",
      filter: plot.status === "ready" ? "brightness(1.1)" : "brightness(0.8)"
    };
    
    if (plot.status === "growing") {
      return <Lottie animationData={growingAnimation} loop={true} style={style} />;
    }
    
    // Map crop types to the animations
    switch (plot.crop) {
      case "carrot":
        return <Lottie animationData={readyCarrot} loop={true} style={style} />; // Carrot
      case "radish":
        return <Lottie animationData={readyRadish} loop={true} style={style} />; // Radish
      case "lettuce":
        return <Lottie animationData={readyBroccoli} loop={true} style={style} />; // Using broccoli for lettuce
      case "corn":
        return <Lottie animationData={readyCorn} loop={true} style={style} />; // Corn
      case "eggplant":
        return <Lottie animationData={readyAubergine} loop={true} style={style} />; // Aubergine is eggplant
      case "tomato":
        return <Lottie animationData={readyTomato} loop={true} style={style} />; // Tomato (Dometos)
      case "strawberry":
        return <Lottie animationData={readyZucchini} loop={true} style={style} />; // Using zucchini for strawberry
      case "watermelon":
        return <Lottie animationData={readyPear} loop={true} style={style} />; // Using pear for watermelon
      default:
        return <Lottie animationData={readyCarrot} loop={true} style={style} />; // Default fallback animation
    }
  };

  return (
    <div
      id={id}
      className={getPlotClasses()}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Progress bar for growing plots */}
      {plot.status === "growing" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#111]">
          <div 
            className="h-full bg-white"
            style={{ width: `${growthProgress}%` }}
          />
        </div>
      )}
      
      <div className="aspect-square p-2 flex flex-col items-center justify-center">
        {plot.status === "empty" ? (
          <div className="opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center h-full">
            <Button 
              onClick={onPlant} 
              className="bg-white text-black hover:bg-white/90 border-0 rounded-none"
              size="sm"
            >
              <Sprout className="mr-2 h-4 w-4" />
              Plant
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Crop animation */}
            <div className="relative mb-1">
              {getCropAnimation()}
            </div>
            
            {/* Time display for growing crops */}
            {plot.status === "growing" && timeLeft && (
              <div className="text-xs font-medium bg-black border border-[#333] text-white px-2 py-0.5 noot-text">
                {timeLeft}
              </div>
            )}
            
            {/* Harvest action */}
            {plot.status === "ready" && (
              <Button
                onClick={onHarvest}
                className="mt-1 bg-white text-black hover:bg-white/90 border-0 rounded-none"
                size="sm"
              >
                <Scissors className="mr-2 h-4 w-4" />
                Harvest
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
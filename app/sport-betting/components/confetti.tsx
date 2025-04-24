"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"

export default function Confetti() {
  useEffect(() => {
    // Create confetti effect using canvas-confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Use two different origin points for a fuller effect
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#fcd34d", "#22d3ee", "#a855f7", "#84cc16"]
      });
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // No need to render any DOM elements
  return null;
}

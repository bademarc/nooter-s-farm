import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useGameState } from '../contexts/GameStateContext';
import { usePusherClient } from '../contexts/PusherClientContext';

const CrashoutGame: React.FC = () => {
  const { gameState, setGameState } = useGameState();
  const { pusherClient } = usePusherClient();
  const hasPlayedCrash = useRef<boolean>(false);

  const handleMultiplierUpdate = (multiplier: number) => {
    setGameState((prev) => ({
      ...prev,
      multiplier,
    }));
    
    if (multiplier >= 1.5 && !hasPlayedCrash.current && gameState.state === "active") {
      playExplosion();
      hasPlayedCrash.current = true;
      
      setTimeout(() => {
        setCrashVisible(false);
      }, 5000);
    }
  };

  const placeBet = async () => {
    if (!betAmount || isNaN(Number(betAmount)) || Number(betAmount) <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (gameState.state === "active" || gameState.state === "crashed") {
      toast({
        title: "Cannot place bet",
        description: "Betting window is closed - wait for next round",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingBet(true);

    try {
      const response = await fetch("/api/crashout/place-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: gameState.username,
          betAmount: Number(betAmount),
          autoCashoutAt: autoCashout ? Number(autoCashoutMultiplier) : null,
        }),
      });

      // ... existing code ...
    }
  }

  const handleCrashEvent = (point: number) => {
    playExplosion();
    
    setCrashVisible(true);
    setTimeout(() => {
      setCrashVisible(false);
    }, 5000);
    
    setGameState((prev) => ({
      ...prev,
      state: "crashed",
      crashPoint: point,
      gameHistory: [...prev.gameHistory, point],
    }));
    
    setHasPlacedBet(false);
    setHasCashedOut(false);
    setBetAmount("");
    setWinnings(0);
  };

  useEffect(() => {
    if (!gameState.username || !pusherClient) return;

    const multiplierChannel = pusherClient.subscribe("crashout-game");
    
    let lastUpdateTime = 0;
    const updateThreshold = 30;
    
    multiplierChannel.bind("multiplierUpdate", (multiplier: number) => {
      const now = Date.now();
      if (now - lastUpdateTime >= updateThreshold) {
        handleMultiplierUpdate(multiplier);
        lastUpdateTime = now;
      }
    });

    return () => {
      pusherClient.unsubscribe("crashout-game");
    };
  }, [gameState.username, pusherClient]);

  return (
    // ... existing JSX ...
  );
};

export default CrashoutGame; 
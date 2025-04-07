import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import lottie from 'lottie-web';
import GameScene from './scenes/GameScene';

// Make Lottie available globally
if (typeof window !== 'undefined') {
  window.lottie = lottie;
}

const Game = () => {
  const gameRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
        min: {
          width: 320,
          height: 240
        },
        max: {
          width: 1600,
          height: 1200
        }
      },
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
      },
      autoFocus: true
    };

    const game = new Phaser.Game(config);

    return () => {
      window.removeEventListener('resize', checkMobile);
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef} className={isMobile ? 'mobile-game-container' : 'desktop-game-container'} />;
};

export default Game; 
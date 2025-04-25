import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReactP5Wrapper, P5WrappedElementProps } from 'react-p5-wrapper';
import platformerSketch from '../games/game'; // Import the sketch without extension

// Remove static p5 import
// import 'p5'; 

interface SketchProps extends P5WrappedElementProps {
  volume: number;
  isActive: boolean;
}

function P5Wrapper() {
  const [isClient, setIsClient] = useState(false);
  const [soundLibraryReady, setSoundLibraryReady] = useState(false); 
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(1.0); // Add state for volume
  const [isActive, setIsActive] = useState(true); // Track if component is active/visible
  const gameInstanceRef = useRef<any>(null);
  const p5InstanceRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Function to properly clean up p5 and stop all sounds
  const cleanupGame = () => {
    console.log("P5Wrapper: Cleaning up game instance and stopping sounds");
    
    // Stop all sounds first
    if (p5InstanceRef.current) {
      try {
        // Try standard p5.sound methods
        if (typeof p5InstanceRef.current.soundOut !== 'undefined') {
          // Option 1: Try direct access to p5.sound's master output
          p5InstanceRef.current.soundOut.disconnect();
        }
        
        // Option 2: Try global sound context muting
        if (typeof p5InstanceRef.current.getAudioContext === 'function') {
          const audioContext = p5InstanceRef.current.getAudioContext();
          if (audioContext && audioContext.state === 'running') {
            console.log("Suspending audio context");
            audioContext.suspend();
          }
        }
        
        // Option 3: Use game's own sound stopping method if available
        if (gameInstanceRef.current && typeof gameInstanceRef.current.stopAllSounds === 'function') {
          gameInstanceRef.current.stopAllSounds();
        }
      } catch (err) {
        console.warn("Error while stopping sounds:", err);
      }
    }
    
    // Remove the p5 instance itself
    if (p5InstanceRef.current && typeof p5InstanceRef.current.remove === 'function') {
      try {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      } catch (err) {
        console.warn("Error removing p5 instance:", err);
      }
    }
    
    // Clean up any references to game objects
    gameInstanceRef.current = null;
    
    // Remove canvas elements as a fallback
    if (canvasContainerRef.current) {
      const canvases = canvasContainerRef.current.querySelectorAll('canvas');
      canvases.forEach(canvas => canvas.remove());
    }
  };

  // Effect to handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsActive(isVisible);
      
      // When tab becomes hidden, mute all sounds
      if (!isVisible && p5InstanceRef.current) {
        if (typeof p5InstanceRef.current.setMasterVolume === 'function') {
          console.log("Muting sounds as tab is not visible");
          p5InstanceRef.current._prevVolume = masterVolume;
          p5InstanceRef.current.setMasterVolume(0);
        }
      } else if (isVisible && p5InstanceRef.current) {
        // Restore volume when visible again
        if (typeof p5InstanceRef.current.setMasterVolume === 'function' && 
            p5InstanceRef.current._prevVolume !== undefined) {
          console.log("Restoring volume as tab is visible again");
          p5InstanceRef.current.setMasterVolume(p5InstanceRef.current._prevVolume);
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Ensure this only runs client-side first
    setIsClient(true);

    // Cleanup function runs when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupGame();
    };
  }, [masterVolume]);

  // Dynamically import p5 core AND p5.sound *after* client mount
  useEffect(() => {
    if (isClient) {
      console.log("P5Wrapper: Client detected. Attempting dynamic import of p5 core and p5.sound...");
      // Dynamically import p5 core first
      import('p5')
        .then(p5Module => {
          const p5 = p5Module.default; // Get the default export
          // Assign to window explicitly so the addon can find it
          (window as any).p5 = p5; 
          console.log("P5Wrapper: Dynamic import of p5 core successful and assigned to window.p5.");

          // Now dynamically import p5.sound
          return import('p5/lib/addons/p5.sound')
            .then(() => {
              console.log("P5Wrapper: Dynamic import of p5.sound successful.");
              // Check if sound functions are attached to the p5 prototype
              if (p5 && typeof p5.prototype.loadSound === 'function') {
                  console.log("P5Wrapper: p5.sound seems attached to p5 prototype.");
              } else {
                  console.warn("P5Wrapper: p5.sound dynamically imported, but functions not found on p5 prototype. Sound might fail.");
              }
              setSoundLibraryReady(true);
            });
        })
        .catch(err => {
          console.error("P5Wrapper: Failed dynamic import of p5 core or p5.sound:", err);
          setErrorLoading("Failed to load p5 library or sound addon. Sound will be disabled."); 
        });
    }
    
    // Cleanup on effect refresh or component unmount
    return () => {
      cleanupGame();
    };
  }, [isClient]); // Run when isClient becomes true

  // Handle volume change from slider
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(event.target.value);
      setMasterVolume(newVolume);
  };

  // Create a memoized sketch wrapper to prevent recreating the sketch on every render
  const wrappedSketch = useMemo(() => {
    return (p: any) => {
      let gameStarted = false;
      
      // Store p5 instance for cleanup
      p5InstanceRef.current = p;
      
      // Original sketch call - only called once for initialization
      const sketchInstance = platformerSketch(p);
      
      // Store the instance for cleanup
      gameInstanceRef.current = sketchInstance;
      
      // Handle prop updates (like volume changes)
      p.updateWithProps = (props: SketchProps) => {
        // Handle active state changes
        if (props.isActive !== undefined) {
          // If component is not active, pause the game and mute sounds
          if (!props.isActive) {
            if (typeof p.setMasterVolume === 'function') {
              p._prevVolume = props.volume || masterVolume;
              p.setMasterVolume(0);
            }
            
            // Pause game if possible
            if (gameInstanceRef.current && typeof gameInstanceRef.current.pauseGame === 'function') {
              gameInstanceRef.current.pauseGame();
            }
          } else {
            // Restore previous state
            if (typeof p.setMasterVolume === 'function' && p._prevVolume !== undefined) {
              p.setMasterVolume(p._prevVolume);
            }
            
            // Resume game if possible
            if (gameInstanceRef.current && typeof gameInstanceRef.current.resumeGame === 'function') {
              gameInstanceRef.current.resumeGame();
            }
          }
        }
        
        // Handle volume changes
        if (props.volume !== undefined && typeof p.setMasterVolume === 'function') {
          p.setMasterVolume(props.volume);
        } else if (props.volume !== undefined && p.internalMasterVolume !== undefined) {
          // Fallback if setMasterVolume function doesn't exist but the game has a volume property
          p.internalMasterVolume = props.volume;
        }
      };
      
      return sketchInstance;
    };
  }, []); // Empty dependency array means this is created only once

  // Render based on state
  return (
    // Wrap everything in a fragment or div to include the slider
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Canvas container */}
      <div 
        ref={canvasContainerRef}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }} 
      >
        {errorLoading && <div style={{color: 'red'}}>{errorLoading}</div>}
        {!isClient && <div>Loading Sketch...</div>} 
        {isClient && !errorLoading && !soundLibraryReady && <div>Loading Sound Library...</div>} 
        {isClient && !errorLoading && soundLibraryReady && 
          <ReactP5Wrapper 
            sketch={wrappedSketch} 
            volume={masterVolume} // Pass volume prop here
            isActive={isActive} // Pass active state
            key="single-instance-p5-sketch" // Key helps ensure a single instance
          />}
      </div>

      {/* Volume Slider - Only show when sketch is ready */}
      {isClient && !errorLoading && soundLibraryReady && (
        <div style={{ marginTop: '10px', width: '80%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="volumeSlider" style={{ color: 'white', fontSize: '0.9em' }}>Volume:</label>
          <input 
            type="range" 
            id="volumeSlider"
            min="0" 
            max="1" 
            step="0.01" 
            value={masterVolume}
            onChange={handleVolumeChange}
            style={{ flexGrow: 1 }}
          />
           <span style={{ color: 'white', fontSize: '0.9em', minWidth: '30px' }}>{Math.round(masterVolume * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export default P5Wrapper; 
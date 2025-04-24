import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReactP5Wrapper, P5WrappedElementProps } from 'react-p5-wrapper';
import platformerSketch from '../games/game'; // Import the sketch without extension

// Remove static p5 import
// import 'p5'; 

interface SketchProps extends P5WrappedElementProps {
  volume: number;
}

function P5Wrapper() {
  const [isClient, setIsClient] = useState(false);
  const [soundLibraryReady, setSoundLibraryReady] = useState(false); 
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(1.0); // Add state for volume
  const gameInstanceRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Ensure this only runs client-side first
  useEffect(() => {
    setIsClient(true);

    // Cleanup function
    return () => {
      // Clean up any existing game instances
      if (gameInstanceRef.current) {
        console.log("P5Wrapper: Cleaning up previous game instance");
        // Remove existing canvas elements
        if (canvasContainerRef.current) {
          const canvases = canvasContainerRef.current.querySelectorAll('canvas');
          canvases.forEach(canvas => canvas.remove());
        }
      }
    };
  }, []);

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
      
      // Original sketch call - only called once for initialization
      const sketchInstance = platformerSketch(p);
      
      // Store the instance for cleanup
      gameInstanceRef.current = sketchInstance;
      
      // Handle prop updates (like volume changes)
      p.updateWithProps = (props: SketchProps) => {
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
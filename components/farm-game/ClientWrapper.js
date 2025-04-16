'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useState, useEffect } from 'react';

// Import FarmGame with enhanced error handling
const FarmGameComponent = dynamic(
  () => {
    console.log("Attempting to load FarmGame...");
    // We'll use a more controlled approach to load Phaser and FarmGame
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error("FarmGame load timeout");
        reject(new Error("Loading FarmGame timed out"));
      }, 20000); // 20 seconds timeout
      
      // Attempt to import
      import('./FarmGame')
        .then(module => {
          clearTimeout(timeoutId);
          console.log("FarmGame loaded successfully");
          resolve(module.default || module);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error("Failed to load FarmGame:", error);
          // Return fallback component
          resolve(() => (
            <div className="w-full h-[600px] flex items-center justify-center bg-black border border-red-500 text-white">
              <div className="text-center p-4">
                <h3 className="text-xl mb-2">Farm Defense Game Unavailable</h3>
                <p className="text-sm opacity-70 mb-4">Sorry, the farm defense game couldn't be loaded.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ));
        });
    });
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-black/20 border border-white/10">
        <div className="text-white text-center">
          <div className="animate-pulse mb-4">Loading farm defense game...</div>
          <div className="text-sm text-white/60">Please wait while we prepare your defenses</div>
        </div>
      </div>
    ),
  }
);

export default function ClientWrapper(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices on mount
  useEffect(() => {
    setIsLoading(false);
    setIsMobile(window.innerWidth < 768);
    
    // Setup event listeners for window resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show mobile warning if on a small screen
  if (!isLoading && isMobile) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-black border border-yellow-500 text-white p-4">
        <div className="text-center">
          <h3 className="text-lg mb-2">Farm Defense Game</h3>
          <p className="mb-4 text-sm opacity-70">This game works best on larger screens. For the best experience, please play on a tablet or desktop.</p>
          <button 
            onClick={() => setIsMobile(false)}
            className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
          >
            Play Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="w-full h-[600px] flex items-center justify-center bg-black/20 border border-white/10">
          <div className="text-white text-center">
            <div className="animate-pulse mb-4">Loading farm defense game...</div>
            <div className="text-sm text-white/60">Please wait while we prepare your defenses</div>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <div className="w-full max-w-full overflow-hidden">
          <FarmGameComponent {...props} />
        </div>
      </ErrorBoundary>
    </Suspense>
  );
}

// Basic error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in FarmGame component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[600px] flex items-center justify-center bg-black border border-red-500 text-white">
          <div className="text-center p-4">
            <h3 className="text-xl mb-2">Something went wrong</h3>
            <p className="text-sm opacity-70 mb-4">The farm defense game encountered an error</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
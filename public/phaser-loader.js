/**
 * Global Phaser Loader
 * This script helps ensure Phaser is properly loaded before any game components initialize.
 * It should be included in the <head> of the HTML document.
 */

(function() {
  // Set up a flag to track loading status
  window._phaserLoaderInitialized = true;
  
  // Track load attempts
  window._phaserLoadAttempts = 0;
  const MAX_ATTEMPTS = 3;
  
  // Track loading status
  let isLoading = false;
  
  // Sources to try in order
  const sources = [
    '/vendor/phaser.js',  // Try local file first
    'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js',
    'https://unpkg.com/phaser@3.60.0/dist/phaser.min.js'
  ];
  
  // Check if Phaser is already available
  function isPhaserLoaded() {
    return window.Phaser && window.Phaser.Game;
  }
  
  // Load Phaser from a specific source
  function loadPhaserFromSource(source, callback) {
    console.log(`Attempting to load Phaser from: ${source}`);
    
    isLoading = true;
    
    const script = document.createElement('script');
    script.src = source;
    script.async = false;
    
    script.onload = function() {
      console.log(`Script loaded from ${source}, checking for Phaser...`);
      
      // Check if Phaser is now available
      if (isPhaserLoaded()) {
        console.log('Phaser loaded successfully!');
        isLoading = false;
        if (callback) callback(true);
      } else {
        // Wait a bit to see if it initializes
        setTimeout(function() {
          if (isPhaserLoaded()) {
            console.log('Phaser initialized after delay');
            isLoading = false;
            if (callback) callback(true);
          } else {
            console.log('Script loaded but Phaser not initialized');
            isLoading = false;
            if (callback) callback(false);
          }
        }, 500);
      }
    };
    
    script.onerror = function() {
      console.error(`Failed to load from ${source}`);
      isLoading = false;
      if (callback) callback(false);
    };
    
    document.head.appendChild(script);
  }
  
  // Try loading from each source sequentially
  function tryLoadPhaser(index) {
    if (isPhaserLoaded()) {
      console.log('Phaser already loaded!');
      return;
    }
    
    if (isLoading) {
      console.log('Phaser loading already in progress...');
      return;
    }
    
    if (window._phaserLoadAttempts >= MAX_ATTEMPTS) {
      console.error(`Maximum load attempts (${MAX_ATTEMPTS}) reached`);
      return;
    }
    
    window._phaserLoadAttempts++;
    
    if (index >= sources.length) {
      console.error('Failed to load Phaser from all sources');
      
      // As a last resort, try phaser-fallback.js
      loadPhaserFromSource('/vendor/phaser-fallback.js', function(success) {
        console.log('Fallback loader result:', success);
      });
      
      return;
    }
    
    loadPhaserFromSource(sources[index], function(success) {
      if (!success) {
        // Try next source
        tryLoadPhaser(index + 1);
      } else {
        // Successfully loaded
        console.log('Phaser loaded successfully!');
        
        // Dispatch an event for game components
        const event = new CustomEvent('phaser-loaded');
        window.dispatchEvent(event);
      }
    });
  }
  
  // Expose loader to window for emergency use
  window.loadPhaser = function() {
    window._phaserLoadAttempts = 0;
    tryLoadPhaser(0);
  };
  
  // Attempt to load Phaser immediately
  if (!isPhaserLoaded()) {
    console.log('Phaser not detected, attempting to load...');
    tryLoadPhaser(0);
  } else {
    console.log('Phaser already available in window!');
  }
  
  // Set up error handling for Phaser
  window.addEventListener('error', function(event) {
    // Check if error is Phaser-related
    if (event.message && (
      event.message.includes('Phaser') || 
      event.message.includes('WebGL') ||
      event.message.includes('Canvas')
    )) {
      console.error('Game engine error caught:', event.message);
      // Only try reloading if we haven't reached max attempts
      if (window._phaserLoadAttempts < MAX_ATTEMPTS) {
        console.log('Attempting to reload Phaser...');
        tryLoadPhaser(0);
      }
    }
  });
})(); 
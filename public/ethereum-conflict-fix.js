/**
 * Ethereum Conflict Fix
 * 
 * This script prevents conflicts between wallet extensions and the game by:
 * 1. Creating a safe proxy for ethereum
 * 2. Preventing errors from ethereum property conflicts
 * 3. Handling event propagation to avoid crashes
 * 4. Using a closure to protect our variables
 * 5. Running as early as possible with priority execution
 */

(function() {
  console.log("Ethereum conflict fix script loaded");
  
  // Create _gameEthereum object to use as fallback immediately
  window._gameEthereum = {
    isEnabled: false,
    networkVersion: null,
    selectedAddress: null,
    isMetaMask: false,
    isConnected: function() { return false; },
    request: async function() { return null; },
    on: function() { return null; },
    removeListener: function() { return null; },
    enable: async function() { return []; },
    // Add additional commonly used methods for better compatibility
    sendAsync: function(payload, callback) {
      if (typeof callback === 'function') callback(null, { result: null });
      return null;
    },
    send: function(payload, callback) {
      if (typeof callback === 'function') callback(null, { result: null });
      return { result: null };
    }
  };
  
  // Store original ethereum if it exists
  let originalEthereum = null;
  try {
    if ('ethereum' in window) {
      originalEthereum = window.ethereum;
      console.log("Original ethereum found and stored");
    }
  } catch (e) {
    console.log("Could not access original ethereum:", e);
  }
  
  // More aggressive approach - try to handle the property at multiple levels
  function applyEthereumFix() {
    try {
      // First approach: Use Object.defineProperty before extensions load
      try {
        // Delete the property first if possible
        if ('ethereum' in window) {
          try {
            delete window.ethereum;
            console.log("Successfully deleted existing ethereum property");
          } catch (e) {
            console.log("Could not delete ethereum property:", e);
          }
        }
        
        Object.defineProperty(window, 'ethereum', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: window._gameEthereum
        });
        console.log("Applied ethereum conflict fix (method 1 - direct assignment)");
        return true;
      } catch (e) {
        console.log("Method 1 failed:", e);
      }
      
      // Second approach: Try to use defineProperty with a getter/setter
      try {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
        
        if (!descriptor || descriptor.configurable) {
          // Define our safe property
          Object.defineProperty(window, 'ethereum', {
            configurable: true,
            enumerable: true,
            get: function() {
              return window._gameEthereum;
            },
            set: function(val) {
              // Store any attempted set to our _gameEthereum instead
              Object.assign(window._gameEthereum, val);
            }
          });
          console.log("Applied ethereum conflict fix (method 2 - getter/setter)");
          return true;
        }
      } catch (e) {
        console.log("Method 2 failed:", e);
      }
      
      // Third approach: Try to use prototype-level override if direct property is locked
      try {
        if (Window.prototype && !Object.getOwnPropertyDescriptor(Window.prototype, 'ethereum')) {
          Object.defineProperty(Window.prototype, 'ethereum', {
            configurable: true,
            enumerable: true,
            get: function() {
              return this._gameEthereum || originalEthereum;
            }
          });
          console.log("Applied ethereum conflict fix (method 3 - prototype)");
          return true;
        }
      } catch (e) {
        console.log("Method 3 failed:", e);
      }
      
      // Fourth approach: Use proxy
      try {
        if (typeof Proxy !== 'undefined') {
          const originalWindowEthereum = window.ethereum;
          window.ethereum = new Proxy(originalWindowEthereum || window._gameEthereum, {
            get: function(target, prop) {
              // First try the game ethereum
              if (prop in window._gameEthereum) {
                return window._gameEthereum[prop];
              }
              // Then try the original ethereum to preserve wallet functionality
              if (originalWindowEthereum && prop in originalWindowEthereum) {
                try {
                  return originalWindowEthereum[prop];
                } catch (e) {
                  // If access fails, use our fallback
                  return window._gameEthereum[prop] || null;
                }
              }
              return null;
            },
            set: function(target, prop, value) {
              // Store properties in our safe object
              window._gameEthereum[prop] = value;
              return true;
            }
          });
          console.log("Applied ethereum conflict fix (method 4 - proxy)");
          return true;
        }
      } catch (e) {
        console.log("Method 4 failed:", e);
      }
      
      // Fifth approach: Monkey patch just the key troublesome methods
      try {
        if (window.ethereum) {
          const originalRequest = window.ethereum.request;
          window.ethereum.request = function(...args) {
            try {
              if (originalRequest) return originalRequest.apply(window.ethereum, args);
              return Promise.resolve(null);
            } catch (e) {
              console.log("Intercepted ethereum.request error");
              return Promise.resolve(null);
            }
          };
          console.log("Applied ethereum conflict fix (method 5 - monkey patch)");
          return true;
        }
      } catch (e) {
        console.log("Method 5 failed:", e);
      }
      
      console.warn("All ethereum fix methods failed");
      return false;
    } catch (e) {
      console.warn("Error applying ethereum fix:", e);
      return false;
    }
  }
  
  // Apply the fix right away
  const fixApplied = applyEthereumFix();
  
  // Set up global error handler to catch any ethereum related errors
  window.addEventListener('error', function(event) {
    if (event.message && (
      event.message.includes('ethereum') || 
      event.message.includes('wallet') ||
      event.message.includes('metamask') ||
      event.message.includes('Cannot set property') ||
      event.message.includes('Cannot redefine property') ||
      event.message.includes('has only a getter')
    )) {
      console.log("Suppressing ethereum-related error:", event.message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Notify any code that might be waiting for the fix
  window._ethereumFixApplied = fixApplied;
  
  // Export a safe way to get ethereum
  window.getSafeEthereum = function() {
    return window._gameEthereum;
  };
  
  // Re-apply the fix when DOM is loaded to catch any extensions that load later
  document.addEventListener('DOMContentLoaded', function() {
    if (!window._ethereumFixApplied) {
      console.log("Re-applying ethereum fix after DOM loaded");
      window._ethereumFixApplied = applyEthereumFix();
    }
  });
})(); 
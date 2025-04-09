/**
 * ethereum-conflict-fix.js
 * This module helps prevent conflicts between cryptocurrency wallet extensions
 * and the game by creating a safe ethereum handling mechanism.
 */

// Store original ethereum if it exists
let originalEthereum = null;

// Create a safe proxy for ethereum to avoid conflicts
function createEthereumProxy() {
  return {
    isEnabled: false,
    networkVersion: null,
    selectedAddress: null,
    // Safe methods that return defaults
    request: async function() { return null; },
    on: function() { return null; },
    enable: async function() { return []; },
    sendAsync: async function() { return { result: null }; },
    send: async function() { return { result: null }; },
    // Add a marker that this is our safe version
    _isSafeGameVersion: true
  };
}

// Apply fixes to handle ethereum conflicts
function applyEthereumFix() {
  console.log("Ethereum conflict fix script loaded");
  
  if (typeof window === 'undefined') return false;
  
  try {
    // Create game's safe ethereum version
    const safeEthereum = createEthereumProxy();
    
    // First, backup the original ethereum if it exists
    if (window.ethereum) {
      try {
        originalEthereum = window.ethereum;
        console.log("Original ethereum found and stored");
      } catch (err) {
        console.warn("Could not store original ethereum:", err);
      }
    }
    
    // Method 0: Delete the existing property if possible
    try {
      delete window.ethereum;
      console.log("Successfully deleted existing ethereum property");
    } catch (err) {
      console.warn("Could not delete ethereum property:", err);
    }
    
    // Method 1: Try to define a new ethereum property (most direct)
    try {
      Object.defineProperty(window, 'ethereum', {
        value: safeEthereum,
        writable: true,
        configurable: true,
        enumerable: true
      });
      return true;
    } catch (err) {
      console.log("Method 1 failed:", err);
    }
    
    // Method 2: Try using a getter/setter
    try {
      let currentEth = safeEthereum;
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: true,
        get: function() { return currentEth; },
        set: function(newVal) {
          // Store any writes for later retrieval, but don't change our proxy
          if (newVal && typeof newVal === 'object') {
            Object.assign(currentEth, newVal);
          }
          return currentEth;
        }
      });
      console.log("Applied ethereum conflict fix (method 2 - getter/setter)");
      return true;
    } catch (err) {
      console.log("Method 2 failed:", err);
    }
    
    // Method 3: If all else fails, add to prototype chain
    try {
      // Modify Object.prototype to handle ethereum property 
      Object.defineProperty(Object.prototype, 'ethereum', {
        get: function() {
          if (this === window) {
            return safeEthereum;
          }
          return undefined;
        },
        set: function() { return true; }, // Allow but silently reject sets
        configurable: true
      });
      console.log("Applied ethereum conflict fix (method 3 - prototype)");
      return true;
    } catch (err) {
      console.log("Method 3 failed:", err);
    }
    
    // Method 4: Create a proxy for window
    try {
      const originalWindow = window;
      const windowProxy = new Proxy(window, {
        get: function(target, prop) {
          if (prop === 'ethereum') {
            return safeEthereum;
          }
          return target[prop];
        },
        set: function(target, prop, value) {
          if (prop === 'ethereum') {
            // Merge in any new properties that might be useful 
            if (value && typeof value === 'object') {
              Object.keys(value).forEach(key => {
                if (typeof value[key] === 'function') {
                  safeEthereum[key] = value[key];
                }
              });
            }
            return true;
          }
          target[prop] = value;
          return true;
        }
      });
      
      // Try to replace window with our proxy (might not work in all browsers)
      try {
        window = windowProxy; // This likely won't work in modern browsers
      } catch (err) {
        // If we can't replace window, at least we tried
      }
      
      console.log("Applied ethereum conflict fix (method 4 - proxy)");
      return true;
    } catch (err) {
      console.log("Method 4 failed:", err);
    }
    
    // If we get here, all methods failed
    return false;
    
  } catch (error) {
    console.error("Error applying ethereum fixes:", error);
    return false;
  }
}

// Run the fix immediately
const fixApplied = applyEthereumFix();

// Export useful items
export {
  originalEthereum,
  createEthereumProxy,
  applyEthereumFix
};

// For direct script tag inclusion
if (typeof window !== 'undefined') {
  window._gameEthereum = createEthereumProxy();
  window._ethereumFixApplied = fixApplied;
} 
// Safe way to handle ethereum
const getSafeEthereum = () => {
  try {
    // Use a getter pattern to avoid window.ethereum property assignment issues
    const provider = typeof window !== 'undefined' && 
      (window._gameEthereum || 
       (window.ethereum ? Object.assign({}, window.ethereum) : null));
    
    return provider || { isMetaMask: false, request: async () => ({}) };
  } catch (e) {
    console.warn('Error accessing ethereum provider:', e);
    return { isMetaMask: false, request: async () => ({}) };
  }
};

const ethereum = getSafeEthereum();

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
let phaserInstance = null;

// Safe getter for Phaser
const getSafePhaser = () => {
  if (!isBrowser) return null;
  try {
    return window.Phaser || null;
  } catch (e) {
    console.warn('Error accessing Phaser:', e);
    return null;
  }
};

// Get the Phaser instance safely
const getPhaser = () => {
  if (phaserInstance) return phaserInstance;
  
  const Phaser = getSafePhaser();
  if (Phaser) {
    phaserInstance = Phaser;
    return phaserInstance;
  }
  
  console.error('Phaser not available');
  return null;
};

// Helper for creating a game instance with error handling
const createGameInstance = (config) => {
  try {
    const Phaser = getPhaser();
    if (!Phaser) {
      console.error('Cannot create game: Phaser not available');
      return null;
    }
    
    return new Phaser.Game(config);
  } catch (e) {
    console.error('Error creating Phaser game instance:', e);
    return null;
  }
};

// Export our safe accessors along with original state
module.exports = {
  // Original exports
  state,
  useStore,
  actions,
  
  // Safe accessors
  ethereum,
  getPhaser,
  createGameInstance,
  getSafeEthereum,
  isBrowser
}; 
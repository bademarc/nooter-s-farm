// Polyfill for useEffectEvent not available in React 18
if (typeof React !== 'undefined' && typeof React.useEffectEvent === 'undefined') {
  // Mock implementation using useCallback
  React.useEffectEvent = function useEffectEvent(fn) {
    return React.useCallback(fn, []);  // Simple implementation that doesn't properly mimic useEffectEvent
  };
  
  console.warn('Applied polyfill for useEffectEvent - use with caution');
}

export {}; 
/**
 * Phaser.js Fallback
 * Local fallback file that loads Phaser from a CDN as a last resort
 */

(function() {
  console.log("Loading Phaser from fallback file...");

  // Skip if Phaser is already defined
  if (window.Phaser && window.Phaser.Game) {
    console.log("Phaser already loaded, skipping fallback");
    return;
  }

  // Create a script element to load Phaser from a CDN
  const loadPhaser = () => {
    // Array of CDN URLs to try
    const sources = [
      "https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js",
      "https://unpkg.com/phaser@3.60.0/dist/phaser.min.js"
    ];

    // Try loading from each source sequentially
    const trySource = (index) => {
      if (index >= sources.length) {
        console.error("Failed to load Phaser from all sources");
        return;
      }

      const script = document.createElement('script');
      script.src = sources[index];
      script.async = false;

      script.onload = () => {
        console.log(`Phaser loaded successfully from ${sources[index]}`);
        
        // Signal that Phaser is ready
        if (window.Phaser && window.Phaser.Game) {
          const event = new CustomEvent('phaser-loaded');
          window.dispatchEvent(event);
        } else {
          // Wait a bit to see if it initializes
          setTimeout(() => {
            if (window.Phaser && window.Phaser.Game) {
              const event = new CustomEvent('phaser-loaded');
              window.dispatchEvent(event);
            } else {
              // Try next source
              trySource(index + 1);
            }
          }, 500);
        }
      };

      script.onerror = () => {
        console.error(`Failed to load Phaser from ${sources[index]}`);
        // Try next source
        trySource(index + 1);
      };

      document.head.appendChild(script);
    };

    // Start trying from the first source
    trySource(0);
  };

  // Try to load Phaser
  loadPhaser();
})();

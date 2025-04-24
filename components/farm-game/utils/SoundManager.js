/**
 * SoundManager - Handles all sound effects and music for the farm game
 * Provides centralized control for audio loading, playing, and volume management
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {}; // Holds all sound instances { key: soundObject }
    this.soundCategories = {}; // Maps category to array of keys { ui: ['click', 'error'], ... }
    this.music = null;
    this.isMuted = false;
    this.soundsLoaded = false;

    // --- Volume Categories ---
    this.volumes = {
      music: 0.6, // Default music volume
      ui: 0.3,    // Click, error
      coin: 0.4,  // Coins
      action: 0.4,// Plant, harvest, defense_placed
      enemy: 0.3, // Hit, defeat, escaped
      attack: 0.4,// Defense attacks, special attacks
      event: 0.5  // Wave start/complete, victory/game_over
    };
    // --- End Volume Categories ---
  }

  /**
   * Preload all sound effects and music
   */
  preload() {
    try {
      // --- Restore loading all sounds --- 
      console.log("SoundManager: Preloading ALL sounds...");
      
      // Music
      this.scene.load.audio('bgm_gameplay', ['/assets/sounds/game/bgm_gameplay.mp3']);
      
      // UI sounds
      this.scene.load.audio('click', ['/assets/sounds/game/ui_click.mp3']); 
      this.scene.load.audio('coins', ['/assets/sounds/game/coins.mp3']); 
      this.scene.load.audio('coin_collect_batch', ['/assets/sounds/game/coin_collect_batch.mp3']);
      this.scene.load.audio('error', ['/assets/sounds/game/error.mp3']); 
      
      // Game sounds
      // Provide OGG as preferred format, MP3 as fallback for 'plant'
      this.scene.load.audio('plant', [
        '/assets/sounds/game/plant.ogg',
        '/assets/sounds/game/plant.mp3' 
      ]);
      this.scene.load.audio('harvest', ['/assets/sounds/game/harvest.mp3']); 
      this.scene.load.audio('enemy_hit', ['/assets/sounds/game/enemy_hit.mp3']); 
      this.scene.load.audio('enemy_defeat', ['/assets/sounds/game/enemy_defeat.mp3']); 
      this.scene.load.audio('enemy_escaped', ['/assets/sounds/game/enemy_escaped.mp3']); 
      this.scene.load.audio('wave_start', ['/assets/sounds/game/wave_start.mp3']); 
      this.scene.load.audio('wave_complete', ['/assets/sounds/game/wave_complete.mp3']); 
      
      // Defense sounds
      this.scene.load.audio('defense_placed', ['/assets/sounds/game/defense_placed.mp3']); 
      this.scene.load.audio('scarecrow_attack', ['/assets/sounds/game/ice_attack.mp3']); 
      this.scene.load.audio('dog_attack', ['/assets/sounds/game/fire_attack.mp3']); 
      this.scene.load.audio('wizard_attack', ['/assets/sounds/game/wizard_attack.mp3']); 
      this.scene.load.audio('cannon_attack', ['/assets/sounds/game/cannon_attack.mp3']); 
      
      // Special attack sounds
      this.scene.load.audio('ice_attack', ['/assets/sounds/game/ice_attack.mp3']); 
      this.scene.load.audio('fire_attack', ['/assets/sounds/game/fire_attack.mp3']); 
      this.scene.load.audio('explosion_sound', ['/assets/sounds/game/explosion.mp3']); 
      this.scene.load.audio('freeze_sound', ['/assets/sounds/game/freeze.mp3']); 
      
      // Win/lose sounds
      this.scene.load.audio('victory', ['/assets/sounds/game/you_win.mp3']); 
      this.scene.load.audio('game_over', ['/assets/sounds/game/game_over.mp3']);
      // --- End restoring all sounds ---
      
      // Add error handler for missing sounds
      this.scene.load.on('loaderror', (fileObj) => {
        if (fileObj.type === 'audio') {
          console.warn(`Sound asset failed to load: ${fileObj.key}`);
        }
      });
      
      // Handle completion
      this.scene.load.on('complete', () => {
        this.soundsLoaded = true;
        console.log('SoundManager: Load complete event fired.'); // Changed log message
        // --- ADDED: Log cache contents immediately after load complete ---
        // console.log('SoundManager: Cache state immediately after load complete:');
        // console.log('  Audio Cache:', this.scene.cache.audio.entries.entries);
        // console.log('  Sound Manager:', this.scene.sound.sounds);
        // --- END ADDED ---
        // --- Add a small delay before setting up sounds ---
        this.scene.time.delayedCall(100, () => {
          console.log('SoundManager: Delay complete, running setupSounds...');
          this.setupSounds();
        });
        // --- End delay ---
      });
    } catch (error) {
      console.error("Error in SoundManager preload:", error);
    }
  }
  
  /**
   * Set up sound instances after loading, categorized by volume control.
   */
  setupSounds() {
    console.log('SoundManager: Running setupSounds...');
    this.soundCategories = {}; // Reset categories

    // Define categories and their associated sound keys
    const categories = {
      music: ['bgm_gameplay'],
      ui: ['click', 'error'],
      coin: ['coins', 'coin_collect_batch'],
      action: ['plant', 'harvest', 'defense_placed'],
      enemy: ['enemy_hit', 'enemy_defeat', 'enemy_escaped'],
      attack: [
        'scarecrow_attack', 'dog_attack', 'wizard_attack', 'cannon_attack',
        'ice_attack', 'fire_attack', 'explosion_sound', 'freeze_sound'
      ],
      event: ['wave_start', 'wave_complete', 'victory', 'game_over']
    };

    // Create sound instances and categorize them
    Object.entries(categories).forEach(([category, keys]) => {
      this.soundCategories[category] = []; // Initialize category array

      keys.forEach(key => {
        try {
          const volume = this.volumes[category] ?? 0.5; // Use ?? for default
          const isMusic = category === 'music';
          
          const soundInstance = this.scene.sound.add(key, { 
            volume: volume, 
            loop: isMusic // Only loop music
          });

          if (soundInstance) {
            this.sounds[key] = soundInstance;
            this.soundCategories[category].push(key); // Add key to category mapping

            if (isMusic) {
              this.music = soundInstance; // Assign music instance
            }
            // console.log(`SoundManager: Added '${key}' to category '${category}' with volume ${volume.toFixed(2)}`);
          } else {
            console.warn(`SoundManager: scene.sound.add('${key}') failed.`);
          }
        } catch (error) {
          console.warn(`SoundManager: Could not create sound instance for ${key}:`, error);
        }
      });
    });

    console.log('SoundManager: Setup complete.');// Categories:', this.soundCategories);
  }
  
  /**
   * Play a sound effect
   * @param {string} key - Sound key
   * @param {object} options - Optional config to override defaults (volume, etc)
   */
  play(key, options = {}) {
     if (this.isMuted) {
        // Allow essential UI feedback even when muted, but play quietly
        if (key === 'click' || key === 'error') {
             const sound = this.sounds[key];
             if (sound) {
                 sound.play({...options, volume: 0.1 * (this.volumes.ui ?? 0.5) }); // Play at 10% of UI volume
             }
            return; // Stop further processing for muted UI sounds
        } else {
            return; // Don't play other sounds if muted
        }
    }

    try {
      const sound = this.sounds[key];
      if (sound) {
        sound.play(options); // Play normally if not muted
      } else {
        console.warn(`SoundManager: Sound '${key}' not found to play.`);
      }
    } catch (error) {
      console.warn(`SoundManager: Error playing sound ${key}:`, error);
    }
  }
  
  /**
   * Start background music
   */
  playMusic() {
    if (!this.music) {
        console.warn("SoundManager: Cannot play music, instance not ready.");
        return;
    }
    if (this.isMuted) {
        console.log("SoundManager: Muted, not playing music.");
        return; // Don't play if muted
    }
    
    try {
      if (!this.music.isPlaying) {
        this.music.play();
        // console.log("SoundManager: Background music started.");
      }
    } catch (error) {
      console.warn('SoundManager: Error playing background music:', error);
    }
  }
  
  /**
   * Stop background music
   */
  stopMusic() {
    if (!this.music) return;
    
    try {
      if (this.music.isPlaying) {
        this.music.stop();
        // console.log("SoundManager: Background music stopped.");
      }
    } catch (error) {
      console.warn('SoundManager: Error stopping background music:', error);
    }
  }
  
  /**
   * Mute all sounds
   */
  mute() {
    console.log("SoundManager: Muting.");
    this.isMuted = true;
    if (this.music?.isPlaying) {
      this.music.pause();
      console.log("SoundManager: Music paused.");
    }
  }
  
  /**
   * Unmute all sounds
   */
  unmute() {
    console.log("SoundManager: Unmuting.");
    this.isMuted = false;
    if (this.music?.isPaused) {
      this.music.resume();
      console.log("SoundManager: Music resumed.");
    } else if (this.music && !this.music.isPlaying) {
       this.playMusic(); // Attempt to play if it wasn't playing but should be
    }
  }
  
  /**
   * Toggle mute state
   */
  toggleMute() {
    console.log(`SoundManager: Toggling mute. Currently ${this.isMuted ? 'muted' : 'unmuted'}`);
    if (this.isMuted) this.unmute();
    else this.mute();
    console.log(`SoundManager: New mute state: ${this.isMuted}`);
    return this.isMuted;
  }
  
  /**
   * Set volume for a specific category
   * @param {string} category - Category name
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(category, volume) {
    const clampedVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    if (this.volumes[category] === undefined) {
      console.warn(`SoundManager: Unknown volume category '${category}'`);
      return;
    }

    this.volumes[category] = clampedVolume;
    console.log(`SoundManager: Setting volume for category '${category}' to ${volume.toFixed(2)}`);

    // Update the actual sound instances in this category
    if (this.soundCategories[category]) {
      this.soundCategories[category].forEach(key => {
        const sound = this.sounds[key];
        if (sound) {
          try {
            sound.setVolume(clampedVolume);
          } catch (error) {
            console.warn(`SoundManager: Error setting volume for sound key '${key}' in category '${category}':`, error);
          }
        }
      });
    } else if (category === 'music' && this.music) {
        // Special handling for music if setup hasn't run yet or failed partially
        try { this.music.setVolume(clampedVolume); } catch (e) { /* ignore */ }
    }
  }

  // Helper methods for specific categories
  setMusicVolume(volume) { this.setVolume('music', volume); }
  setUiVolume(volume) { this.setVolume('ui', volume); }
  setCoinVolume(volume) { this.setVolume('coin', volume); }
  setActionVolume(volume) { this.setVolume('action', volume); }
  setEnemyVolume(volume) { this.setVolume('enemy', volume); }
  setAttackVolume(volume) { this.setVolume('attack', volume); }
  setEventVolume(volume) { this.setVolume('event', volume); }
  
  // --- SFX Volume Setter ---
  setSfxVolume(volume) {
    const sfxCategories = ['ui', 'coin', 'action', 'enemy', 'attack', 'event'];
    sfxCategories.forEach(category => {
      // Use the main setVolume which handles clamping and updating instances
      this.setVolume(category, volume); 
    });
    // console.log(`SoundManager: Setting global SFX volume to ${volume.toFixed(2)}`);
  }
  // --- End SFX Volume Setter ---
  
  // --- Volume Getters ---
  getMusicVolume() {
    return this.volumes.music ?? 1; // Default to 1 if not set
  }

  getSfxVolume() {
    // Return the volume of a representative category, like 'action' or 'ui'
    // All SFX categories should have the same volume after setSfxVolume is called
    return this.volumes.action ?? 1; // Default to 1 if not set
  }
  // --- End Volume Getters ---
  
  /**
   * Clean up and destroy all sounds
   */
  destroy() {
    console.log("SoundManager: Destroying...");
    // Stop the music
    if (this.music) {
      try { this.music.stop(); } catch(e){} // Try stopping first
      try { this.music.destroy(); } catch(e){} // Then destroy
    }
    
    // Destroy all sound effects
    Object.values(this.sounds).forEach(sound => {
      if (sound?.destroy) { // Optional chaining for safety
        try {
            sound.destroy();
        } catch(e) {
             console.warn(`SoundManager: Error destroying sound: ${e}`);
        }
      }
    });
    
    this.sounds = {};
    this.soundCategories = {};
    this.music = null;
    console.log("SoundManager: Destroyed.");
  }
} 
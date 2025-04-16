/**
 * SoundManager - Handles all sound effects and music for the farm game
 * Provides centralized control for audio loading, playing, and volume management
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.music = null;
    this.isMuted = false;
    this.soundsLoaded = false;
    this.effectsVolume = 0.6;
    this.musicVolume = 0.3;
  }

  /**
   * Preload all sound effects and music
   */
  preload() {
    try {
      // Music
      this.scene.load.audio('bgm_gameplay', [
        '/assets/sounds/game/bgm_gameplay.mp3'
      ]);
      
      // UI sounds
      this.scene.load.audio('click', ['/assets/sounds/game/ui_click.mp3']);
      this.scene.load.audio('coins', ['/assets/sounds/game/coins.mp3']);
      this.scene.load.audio('error', ['/assets/sounds/game/error.mp3']);
      
      // Game sounds
      this.scene.load.audio('plant', ['/assets/sounds/game/plant.mp3']);
      this.scene.load.audio('harvest', ['/assets/sounds/game/harvest.mp3']);
      this.scene.load.audio('enemy_hit', ['/assets/sounds/game/enemy_hit.mp3']);
      this.scene.load.audio('enemy_defeat', ['/assets/sounds/game/enemy_defeat.mp3']);
      this.scene.load.audio('enemy_escaped', ['/assets/sounds/game/enemy_escaped.mp3']);
      this.scene.load.audio('wave_start', ['/assets/sounds/game/wave_start.mp3']);
      this.scene.load.audio('wave_complete', ['/assets/sounds/game/wave_complete.mp3']);
      
      // Defense sounds
      this.scene.load.audio('defense_placed', ['/assets/sounds/game/defense_placed.mp3']);
      this.scene.load.audio('scarecrow_attack', ['/assets/sounds/game/s1_a9.mp3']);
      this.scene.load.audio('dog_attack', ['/assets/sounds/game/s1_bf.mp3']);
      this.scene.load.audio('wizard_attack', ['/assets/sounds/game/mus_computer.mp3']);
      this.scene.load.audio('cannon_attack', ['/assets/sounds/game/nschg-csht.mp3']);
      
      // Special attack sounds
      this.scene.load.audio('ice_attack', ['/assets/sounds/game/loop_electricity_05.mp3']);
      this.scene.load.audio('fire_attack', ['/assets/sounds/game/mus_drone.mp3']);
      this.scene.load.audio('explosion_sound', ['/assets/sounds/game/s1_c6.mp3']);
      this.scene.load.audio('freeze_sound', ['/assets/sounds/game/mus_mode.mp3']);
      
      // Win/lose sounds
      this.scene.load.audio('victory', ['/assets/sounds/game/you_win.mp3']);
      this.scene.load.audio('game_over', ['/assets/sounds/game/14-player-death.mp3']);
      
      // Add error handler for missing sounds
      this.scene.load.on('loaderror', (fileObj) => {
        if (fileObj.type === 'audio') {
          console.warn(`Sound asset failed to load: ${fileObj.key}`);
        }
      });
      
      // Handle completion
      this.scene.load.on('complete', () => {
        this.soundsLoaded = true;
        console.log('All sound assets loaded (or failed gracefully)');
        this.setupSounds();
      });
    } catch (error) {
      console.error("Error in SoundManager preload:", error);
    }
  }
  
  /**
   * Set up sound instances after loading
   */
  setupSounds() {
    // Set up the music
    if (this.scene.sound.get('bgm_gameplay')) {
      this.music = this.scene.sound.add('bgm_gameplay', {
        volume: this.musicVolume,
        loop: true
      });
    }
    
    // Create a mapping of sound keys to their configurations
    const soundConfigs = {
      // UI sounds
      click: { volume: 0.5 },
      coins: { volume: 0.6 },
      error: { volume: 0.5 },
      
      // Game sounds
      plant: { volume: 0.6 },
      harvest: { volume: 0.7 },
      enemy_hit: { volume: 0.5 },
      enemy_defeat: { volume: 0.6 },
      enemy_escaped: { volume: 0.7 },
      wave_start: { volume: 0.7 },
      wave_complete: { volume: 0.7 },
      
      // Defense sounds
      defense_placed: { volume: 0.6 },
      scarecrow_attack: { volume: 0.5 },
      dog_attack: { volume: 0.6 },
      wizard_attack: { volume: 0.6 },
      cannon_attack: { volume: 0.7 },
      
      // Special attack sounds
      ice_attack: { volume: 0.6 },
      fire_attack: { volume: 0.6 },
      explosion_sound: { volume: 0.7 },
      freeze_sound: { volume: 0.6 },
      
      // Win/lose sounds
      victory: { volume: 0.8 },
      game_over: { volume: 0.7 }
    };
    
    // Create sound instances
    Object.entries(soundConfigs).forEach(([key, config]) => {
      try {
        if (this.scene.sound.get(key)) {
          this.sounds[key] = this.scene.sound.add(key, config);
        }
      } catch (error) {
        console.warn(`Could not create sound instance for ${key}:`, error);
      }
    });
  }
  
  /**
   * Play a sound effect
   * @param {string} key - Sound key
   * @param {object} options - Optional config to override defaults (volume, etc)
   */
  play(key, options = {}) {
    if (this.isMuted) return;
    
    try {
      // Use sound from this.sounds if it exists
      if (this.sounds[key]) {
        this.sounds[key].play(options);
        return;
      }
      
      // Fallback to direct play if not in this.sounds
      if (this.scene.sound.get(key)) {
        this.scene.sound.play(key, options);
      } else {
        console.warn(`Sound ${key} not found`);
      }
    } catch (error) {
      console.warn(`Error playing sound ${key}:`, error);
    }
  }
  
  /**
   * Start background music
   */
  playMusic() {
    if (this.isMuted || !this.music) return;
    
    try {
      if (!this.music.isPlaying) {
        this.music.play();
      }
    } catch (error) {
      console.warn('Error playing background music:', error);
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
      }
    } catch (error) {
      console.warn('Error stopping background music:', error);
    }
  }
  
  /**
   * Mute all sounds
   */
  mute() {
    this.isMuted = true;
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }
  
  /**
   * Unmute all sounds
   */
  unmute() {
    this.isMuted = false;
    if (this.music && !this.music.isPlaying) {
      this.music.resume();
    }
  }
  
  /**
   * Toggle mute state
   */
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }
  
  /**
   * Set effects volume
   * @param {number} volume - Volume level (0-1)
   */
  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    
    // Update all sound effects volumes
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound !== this.music) {
        sound.setVolume(this.effectsVolume);
      }
    });
  }
  
  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.setVolume(this.musicVolume);
    }
  }
  
  /**
   * Clean up and destroy all sounds
   */
  destroy() {
    // Stop the music
    if (this.music) {
      this.music.stop();
      this.music.destroy();
    }
    
    // Destroy all sound effects
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.destroy) {
        sound.destroy();
      }
    });
    
    this.sounds = {};
    this.music = null;
  }
} 
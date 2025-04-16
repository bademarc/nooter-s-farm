/**
 * SoundTestPanel - A utility class for testing game sounds during development
 * Provides a UI panel with buttons to test all registered sounds
 */
export default class SoundTestPanel {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.soundManager = soundManager;
    this.container = null;
    this.isVisible = false;
    this.buttons = {};
    this.volumeSliders = {};
  }

  /**
   * Create and show the sound test panel
   */
  create() {
    if (this.container) {
      this.container.setVisible(true);
      this.isVisible = true;
      return;
    }

    // Create panel container
    this.container = this.scene.add.container(400, 300);
    
    // Add background
    const background = this.scene.add.rectangle(0, 0, 700, 500, 0x222222, 0.9);
    background.setStrokeStyle(2, 0xffffff);
    this.container.add(background);
    
    // Add title
    const title = this.scene.add.text(0, -230, 'Sound Test Panel', { 
      fontFamily: 'Arial', 
      fontSize: '24px',
      color: '#ffffff' 
    }).setOrigin(0.5);
    this.container.add(title);
    
    // Add close button
    const closeButton = this.scene.add.rectangle(330, -230, 30, 30, 0xff0000);
    const closeText = this.scene.add.text(330, -230, 'X', { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    }).setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.hide());
    this.container.add(closeButton);
    this.container.add(closeText);
    
    // Create volume controls
    this.createVolumeControls();
    
    // Create sound test buttons
    this.createSoundButtons();
    
    // Make container interactive
    background.setInteractive();
    
    // Set container as visible
    this.isVisible = true;
    
    // Place on top
    this.scene.children.bringToTop(this.container);
  }
  
  /**
   * Create volume control sliders
   */
  createVolumeControls() {
    // Music volume
    const musicLabel = this.scene.add.text(-300, -180, 'Music Volume', { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    });
    this.container.add(musicLabel);
    
    const musicVolume = this.soundManager.musicVolume * 100;
    const musicVolumeText = this.scene.add.text(300, -180, `${musicVolume.toFixed(0)}%`, { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    }).setOrigin(1, 0);
    this.container.add(musicVolumeText);
    
    const musicSliderBg = this.scene.add.rectangle(-50, -170, 500, 10, 0x666666);
    this.container.add(musicSliderBg);
    
    const musicSliderFg = this.scene.add.rectangle(-50, -170, 500 * (musicVolume / 100), 10, 0x00ffff);
    musicSliderFg.setOrigin(0, 0.5);
    this.container.add(musicSliderFg);
    
    const musicSliderKnob = this.scene.add.circle(-50 + 500 * (musicVolume / 100), -170, 15, 0xffffff);
    musicSliderKnob.setInteractive({ draggable: true, useHandCursor: true });
    this.container.add(musicSliderKnob);
    
    musicSliderKnob.on('drag', (pointer, dragX) => {
      const x = Math.max(-50, Math.min(dragX, 450));
      const percent = (x + 50) / 500;
      
      musicSliderKnob.x = x;
      musicSliderFg.width = 500 * percent;
      musicVolumeText.setText(`${(percent * 100).toFixed(0)}%`);
      
      this.soundManager.setMusicVolume(percent);
    });
    
    // Effects volume
    const effectsLabel = this.scene.add.text(-300, -130, 'Effects Volume', { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    });
    this.container.add(effectsLabel);
    
    const effectsVolume = this.soundManager.effectsVolume * 100;
    const effectsVolumeText = this.scene.add.text(300, -130, `${effectsVolume.toFixed(0)}%`, { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    }).setOrigin(1, 0);
    this.container.add(effectsVolumeText);
    
    const effectsSliderBg = this.scene.add.rectangle(-50, -120, 500, 10, 0x666666);
    this.container.add(effectsSliderBg);
    
    const effectsSliderFg = this.scene.add.rectangle(-50, -120, 500 * (effectsVolume / 100), 10, 0x00ffff);
    effectsSliderFg.setOrigin(0, 0.5);
    this.container.add(effectsSliderFg);
    
    const effectsSliderKnob = this.scene.add.circle(-50 + 500 * (effectsVolume / 100), -120, 15, 0xffffff);
    effectsSliderKnob.setInteractive({ draggable: true, useHandCursor: true });
    this.container.add(effectsSliderKnob);
    
    effectsSliderKnob.on('drag', (pointer, dragX) => {
      const x = Math.max(-50, Math.min(dragX, 450));
      const percent = (x + 50) / 500;
      
      effectsSliderKnob.x = x;
      effectsSliderFg.width = 500 * percent;
      effectsVolumeText.setText(`${(percent * 100).toFixed(0)}%`);
      
      this.soundManager.setEffectsVolume(percent);
    });
    
    // Mute toggle
    const muteLabel = this.scene.add.text(-300, -80, 'Mute All Sounds', { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    });
    this.container.add(muteLabel);
    
    const muteButton = this.scene.add.rectangle(200, -70, 150, 40, this.soundManager.isMuted ? 0xff0000 : 0x00ff00);
    muteButton.setInteractive({ useHandCursor: true });
    this.container.add(muteButton);
    
    const muteText = this.scene.add.text(200, -70, this.soundManager.isMuted ? 'MUTED' : 'UNMUTED', { 
      fontFamily: 'Arial', 
      fontSize: '16px',
      color: '#ffffff' 
    }).setOrigin(0.5);
    this.container.add(muteText);
    
    muteButton.on('pointerdown', () => {
      const isMuted = this.soundManager.toggleMute();
      muteButton.fillColor = isMuted ? 0xff0000 : 0x00ff00;
      muteText.setText(isMuted ? 'MUTED' : 'UNMUTED');
    });
  }
  
  /**
   * Create buttons for testing each sound
   */
  createSoundButtons() {
    const soundCategories = {
      'UI Sounds': ['click', 'coins', 'error'],
      'Game Sounds': ['plant', 'harvest', 'enemy_hit', 'enemy_defeat', 'enemy_escaped', 'wave_start', 'wave_complete'],
      'Defense Sounds': ['defense_placed', 'scarecrow_attack', 'dog_attack', 'wizard_attack', 'cannon_attack'],
      'Special Effects': ['ice_attack', 'fire_attack', 'explosion_sound', 'freeze_sound'],
      'Win/Lose': ['victory', 'game_over']
    };
    
    // Music controls separately
    const musicLabel = this.scene.add.text(-300, -30, 'Background Music', { 
      fontFamily: 'Arial', 
      fontSize: '18px',
      color: '#ffffff' 
    });
    this.container.add(musicLabel);
    
    const playMusicBtn = this.scene.add.rectangle(-50, -20, 150, 40, 0x00aa00);
    playMusicBtn.setInteractive({ useHandCursor: true });
    this.container.add(playMusicBtn);
    
    const playMusicText = this.scene.add.text(-50, -20, 'Play Music', { 
      fontFamily: 'Arial', 
      fontSize: '16px',
      color: '#ffffff' 
    }).setOrigin(0.5);
    this.container.add(playMusicText);
    
    playMusicBtn.on('pointerdown', () => {
      this.soundManager.playMusic();
    });
    
    const stopMusicBtn = this.scene.add.rectangle(150, -20, 150, 40, 0xaa0000);
    stopMusicBtn.setInteractive({ useHandCursor: true });
    this.container.add(stopMusicBtn);
    
    const stopMusicText = this.scene.add.text(150, -20, 'Stop Music', { 
      fontFamily: 'Arial', 
      fontSize: '16px',
      color: '#ffffff' 
    }).setOrigin(0.5);
    this.container.add(stopMusicText);
    
    stopMusicBtn.on('pointerdown', () => {
      this.soundManager.stopMusic();
    });
    
    // Create buttons for each sound category
    let yOffset = 30;
    
    Object.entries(soundCategories).forEach(([category, sounds]) => {
      // Category label
      const categoryLabel = this.scene.add.text(-300, yOffset, category, { 
        fontFamily: 'Arial', 
        fontSize: '20px',
        color: '#ffffff' 
      });
      this.container.add(categoryLabel);
      
      yOffset += 40;
      
      // Create a row of buttons
      let xOffset = -300;
      sounds.forEach(sound => {
        const btnWidth = 130;
        const btnHeight = 40;
        const margin = 10;
        
        // Create button
        const button = this.scene.add.rectangle(xOffset + btnWidth/2, yOffset, btnWidth, btnHeight, 0x4444aa);
        button.setInteractive({ useHandCursor: true });
        this.container.add(button);
        
        // Button text
        const text = this.scene.add.text(xOffset + btnWidth/2, yOffset, sound, { 
          fontFamily: 'Arial', 
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(text);
        
        // Play sound on click
        button.on('pointerdown', () => {
          button.fillColor = 0x44aa44; // Change color briefly when clicked
          this.soundManager.play(sound);
          setTimeout(() => {
            button.fillColor = 0x4444aa;
          }, 300);
        });
        
        xOffset += btnWidth + margin;
        
        // Wrap to next row if needed
        if (xOffset > 300) {
          xOffset = -300;
          yOffset += btnHeight + margin;
        }
      });
      
      // Move to next section
      yOffset += 60;
    });
  }
  
  /**
   * Hide the sound test panel
   */
  hide() {
    if (this.container) {
      this.container.setVisible(false);
      this.isVisible = false;
    }
  }
  
  /**
   * Toggle the sound test panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.create();
    }
  }
  
  /**
   * Clean up and destroy the panel
   */
  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.buttons = {};
    this.volumeSliders = {};
    this.isVisible = false;
  }
} 
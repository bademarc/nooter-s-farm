// import 'p5/lib/addons/p5.sound';

// Remove p5 import - P5Wrapper handles it
// import p5 from 'p5';

export default function platformerSketch(p) {
  // Game state variables moved inside the sketch function
  let player;
  let platforms = [];
  let stars = [];
  let enemies = [];
  let score;
  let gravity;
  let jumpForce;
  let doubleJumpForce; // Define doubleJumpForce here
  let isGameOver;
  let isGameWon; // Will represent winning the *current* level
  let isGameComplete; // Will represent winning the *entire* game - NOW LESS RELEVANT
  let gameFont; // Optional: Load a font if desired
  // let levelGoal = null; // Add variable to store the level goal object - REMOVED

  // Add variables for level management
  let currentLevelIndex = 0;
  // Remove levelData array - we'll generate levels procedurally instead
  
  // Add variables for player images
  let nootIdleImg;
  // let nootRunImg; // Add later if you have run/jump images
  // let nootJumpImg;

  // Add variables for enemy images
  let enemyFoxImg;
  let enemyRabbitImg;
  let enemyBirdImg;

  // Add variables for parallax background images
  // Store background layers in an array of sets
  let backgroundSets = [];
  let currentBackgroundSetIndex = 0; // Track which background set is active
  // Need to assign these within loadLevelData now
  let bgLayer1, bgLayer2, bgLayer3, bgLayer4;

  // Add variables for sounds
  let jumpSound;
  let coinSound;
  let defeatSound;
  let gameOverSound;
  let victorySound;
  let bgMusic;
  let landSound;
  let powerupCollectSound; // Sound for collecting powerups
  let soundsLoaded = false; // Flag to track loading
  let particles = []; // Array to hold particles
  let floatingScores = []; // Array for score pop-ups
  let projectiles = []; // Array for enemy projectiles
  let hazards = []; // Array for level hazards (e.g., spikes)
  let powerups = []; // Array for power-up items
  let isGodMode = false; // For testing

  // Control Feel Variables
  let coyoteTimeCounter = 0;
  const COYOTE_TIME_DURATION = 6; // Frames (0.1 seconds)
  let jumpBufferCounter = 0;
  const JUMP_BUFFER_DURATION = 8; // Frames (~0.13 seconds)

  // Combo System variables
  let stompComboCount = 0;
  let comboDisplayTimer = 0; // How long to show combo text
  const COMBO_DISPLAY_DURATION = 90; // Frames (1.5 seconds)

  // Screen Shake variables - RE-ADDED
  let shakeDuration = 0;
  let shakeIntensity = 0;
  let currentShakeX = 0;
  let currentShakeY = 0;

  // Camera variables
  let cameraX = 0;
  let levelEndX = 800; // Initial guess, will be updated in loadLevelData

  // Volume control variables
  let internalMasterVolume = 1.0; // Renamed to avoid conflict with wrapper state
  const sfxVolumeMultiplier = 0.3; // Multiplier for sound effects (30%)

  // --- ADDED: Screen Shake Function ---
  const triggerShake = (intensity, duration) => {
      // Don't override a stronger shake with a weaker one
      if (intensity >= shakeIntensity || duration > shakeDuration) { 
          shakeIntensity = intensity;
          shakeDuration = duration;
          console.log(`Screen shake triggered: intensity=${intensity}, duration=${duration}`);
      }
  };

  // --- Helper to update shake effect ---
  const updateShake = () => {
      if (shakeDuration > 0) {
          shakeDuration--;
          currentShakeX = p.random(-shakeIntensity, shakeIntensity);
          currentShakeY = p.random(-shakeIntensity, shakeIntensity);
          if (shakeDuration <= 0) {
              shakeIntensity = 0;
              currentShakeX = 0;
              currentShakeY = 0;
          }
      } else {
          currentShakeX = 0;
          currentShakeY = 0;
      }
  };
  // --- END Screen Shake ---

  // Create volume setter method that can be called externally
  p.setMasterVolume = function(value) {
    if (typeof value === 'number' && value >= 0 && value <= 1) {
      internalMasterVolume = value;
      console.log(`Game: Setting master volume to ${value}`);
      
      // Update the actual volume of playing sounds
      if (bgMusic && soundsLoaded) {
        bgMusic.setVolume(internalMasterVolume);
      }
    }
  };

  // Add method to handle props from ReactP5Wrapper
  p.updateWithProps = function(props) {
    // Check if we have a volume prop
    if (props.volume !== undefined) {
      p.setMasterVolume(props.volume);
    }
  };

  // Level Dressing Assets
  let platformTexture;
  let decorationTree1;
  let decorations = []; // Array for decoration objects {img, x, y}
  // let goalFlagImg; // Image for the goal flag - REMOVED

  // --- Preload Function --- 
  p.preload = () => {
    console.log("Preloading assets...");
    
    // Helper function to check loaded image
    const checkImage = (img, name) => {
        if (!img || img.width <= 0 || img.height <= 0) {
            console.warn(`Asset Warning: Image '${name}' failed to load properly or has invalid dimensions.`);
        }
    };

    // Player images
    nootIdleImg = p.loadImage('/defense/noot idle.png', img => checkImage(img, 'nootIdleImg'));

    // Enemy images
    const enemyBasePath = '/characters/craftpix-net-459799-free-low-level-monsters-pixel-icons-32x32/PNG/Transperent/';
    enemyFoxImg = p.loadImage(enemyBasePath + 'Icon9.png', img => checkImage(img, 'enemyFoxImg'));
    enemyRabbitImg = p.loadImage(enemyBasePath + 'Icon2.png', img => checkImage(img, 'enemyRabbitImg'));
    enemyBirdImg = p.loadImage(enemyBasePath + 'Icon1.png', img => checkImage(img, 'enemyBirdImg'));

    // Level Dressing Assets
    const assetBasePath = '/assets/platformer/sfx and backgrounds/Small Forest Asset Pack/Small Forest Asset Pack/';
    try {
        platformTexture = p.loadImage(assetBasePath + 'Ground tileset/Bright-grass-tileset.png', img => checkImage(img, 'platformTexture'));
        decorationTree1 = p.loadImage(assetBasePath + 'Trees/Tree-1/Tree-1-1.png', img => checkImage(img, 'decorationTree1'));
        console.log("Level dressing assets loaded (check warnings above for issues).");
    } catch (err) {
        console.error("Error loading level dressing assets:", err);
    }

    // Parallax Background images - Load only the 4 confirmed sets
    const bgSetsToLoad = [
        {
            name: 'summer1',
            path: '/assets/platformer/sfx and backgrounds/Free-Summer-Pixel-Art-Backgrounds/PNG/summer 1/',
            layers: ['1.png', '2.png', '3.png', '4.png'] // Furthest to closest (Special case for set 1?)
        },
        {
            name: 'summer2',
            path: '/assets/platformer/sfx and backgrounds/Free-Summer-Pixel-Art-Backgrounds/PNG/summer 2/',
            layers: ['1.png', '2.png', '3.png', 'Summer2.png'] // Furthest to closest, using pattern
        },
        {
            name: 'summer3',
            path: '/assets/platformer/sfx and backgrounds/Free-Summer-Pixel-Art-Backgrounds/PNG/summer 3/',
            layers: ['1.png', '2.png', '3.png', 'Summer3.png'] // Furthest to closest, using pattern
        },
        {
            name: 'summer4',
            path: '/assets/platformer/sfx and backgrounds/Free-Summer-Pixel-Art-Backgrounds/PNG/summer 4/',
            layers: ['1.png', '2.png', '3.png', 'Summer4.png'] // Furthest to closest, using confirmed filename
        },
        // Removed sets 5-8 as their folders could not be found/verified
    ];

    backgroundSets = bgSetsToLoad.map(setInfo => {
        console.log(`Loading background set: ${setInfo.name}`);
        const loadedLayers = {};
        try {
            // Load layers based on the specified filenames
            if (setInfo.layers && setInfo.layers.length === 4) {
                loadedLayers.layer1 = p.loadImage(setInfo.path + setInfo.layers[0], img => checkImage(img, `${setInfo.name}-${setInfo.layers[0]}`)); 
                loadedLayers.layer2 = p.loadImage(setInfo.path + setInfo.layers[1], img => checkImage(img, `${setInfo.name}-${setInfo.layers[1]}`));
                loadedLayers.layer3 = p.loadImage(setInfo.path + setInfo.layers[2], img => checkImage(img, `${setInfo.name}-${setInfo.layers[2]}`));
                loadedLayers.layer4 = p.loadImage(setInfo.path + setInfo.layers[3], img => checkImage(img, `${setInfo.name}-${setInfo.layers[3]}`)); 
                console.log(`Background set ${setInfo.name} layers loaded.`);
                return { name: setInfo.name, layers: loadedLayers }; // Return successfully loaded set
            } else {
                console.error(`Incorrect layer configuration for background set ${setInfo.name}. Skipping.`);
                return null; // Indicate failure
            }
        } catch (err) {
            console.error(`Error loading background set ${setInfo.name}:`, err);
            return null; // Indicate failure
        }
    }).filter(set => set !== null); // Keep only successfully loaded sets

    if (backgroundSets.length === 0) {
        console.error("CRITICAL: No background sets loaded successfully!");
    } else {
        console.log(`Successfully loaded ${backgroundSets.length} background sets.`);
    }

    // Load Sounds
    try {
      if (p.loadSound) { 
        console.log("p.loadSound function found, attempting to load sounds.");
        p.soundFormats('mp3', 'ogg', 'wav'); // Add wav format
        const sfxBasePath = '/assets/platformer/sfx and backgrounds/FreeSFX/FreeSFX/GameSFX/';
        const oldSfxBasePath = '/assets/platformer/';
        
        const soundLoadedCallback = () => {
            let allSounds = [jumpSound, coinSound, defeatSound, gameOverSound, victorySound, bgMusic, landSound, powerupCollectSound];
            let loadedCount = allSounds.filter(s => s && s.isLoaded()).length;
            let totalSounds = allSounds.length; // Now 8 sounds
            console.log(`Sound loaded: ${loadedCount}/${totalSounds}`); // Log progress
            if (loadedCount === totalSounds) {
                 console.log("All sounds reported as loaded.");
                 soundsLoaded = true;
                 // Try starting music now if context is already running
                 if (p.getAudioContext && p.getAudioContext().state === 'running' && !bgMusic.isPlaying()) {
                     console.log("Sounds loaded & context running, attempting to loop music.");
                     bgMusic.setVolume(internalMasterVolume); // Use internal volume
                     bgMusic.loop();
                 }
            }
        };
        const soundLoadError = (err) => {
            console.error("Error loading sound file:", err);
        };

        // Use new WAV files
        jumpSound = p.loadSound(sfxBasePath + 'Bounce Jump/Retro Jump Classic 08.wav', soundLoadedCallback, soundLoadError);
        coinSound = p.loadSound(sfxBasePath + 'PickUp/Retro PickUp Coin 04.wav', soundLoadedCallback, soundLoadError);
        landSound = p.loadSound(sfxBasePath + 'Impact/Retro Impact Punch Hurt 01.wav', soundLoadedCallback, soundLoadError);
        // Add powerup sound (using a pick-up variation)
        powerupCollectSound = p.loadSound(sfxBasePath + 'PickUp/Retro PickUp Coin 07.wav', soundLoadedCallback, soundLoadError);
        
        // Keep old ones for now
        defeatSound = p.loadSound(oldSfxBasePath + 'enemy_defeat.mp3', soundLoadedCallback, soundLoadError);
        gameOverSound = p.loadSound(oldSfxBasePath + 'enemy_hit.mp3', soundLoadedCallback, soundLoadError);
        victorySound = p.loadSound(oldSfxBasePath + 'victory.mp3', soundLoadedCallback, soundLoadError);
        bgMusic = p.loadSound(oldSfxBasePath + 'bg_music.mp3', soundLoadedCallback, soundLoadError); 
        
      } else {
        console.warn("p5.sound functions not available on 'p' instance during preload.");
        soundsLoaded = false;
      }
    } catch (error) {
        console.error("Error during sound preload:", error);
        soundsLoaded = false;
    }

    console.log("Preload function finished.");
  };

  // Function to safely play a sound with volume control
  const playSound = (sound) => {
    // Check if the sound exists and is loaded
    if (sound && sound.isLoaded()) {
      // Apply the volume setting (scaled by sfxVolumeMultiplier for effects)
      const effectiveVolume = internalMasterVolume * (sound === bgMusic ? 1.0 : sfxVolumeMultiplier);
      sound.setVolume(effectiveVolume);
      
      // Play the sound
      if (sound.isPlaying()) {
        sound.stop();
      }
      sound.play();
    } else {
      console.warn("Attempted to play sound that wasn't loaded");
    }
  };

  // --- Particle Functions --- 
  const emitParticles = (x, y, count, pColor, options = {}) => {
    const { life = 30, speed = 3, gravity = 0.1, size = 5 } = options;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: p.random(-speed, speed),
        vy: p.random(-speed * 1.5, -speed * 0.5), // Bias upwards
        life: p.random(life * 0.8, life * 1.2),
        maxLife: p.map(p.random(), 0, 1, life * 0.7, life * 1.3), // Vary max life more
        color: pColor,
        size: p.random(size * 0.8, size * 1.5), // Bigger size range
        gravity: gravity
      });
    }
  };

  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      let part = particles[i];
      part.vy += part.gravity;
      part.x += part.vx;
      part.y += part.vy;
      part.life -= 1;
      if (part.life <= 0) {
        particles.splice(i, 1);
      }
    }
  };

  const drawParticles = () => {
    p.noStroke();
    for (let part of particles) {
      const alpha = p.map(part.life, 0, part.maxLife, 0, 255); // Fade out
      // --- ADDED: Slight size pulsing for particles ---
      const sizePulse = p.sin(p.frameCount * 0.5 + part.life * 0.1) * 0.15 + 1.0; // Gentle pulse
      const currentSize = p.map(part.life, 0, part.maxLife, 0, part.size * sizePulse); // Shrink and pulse
      // Ensure color object exists and alpha is valid before setting fill
      if (part.color && alpha > 0 && currentSize > 0) {
           // Check if part.color is a p5.Color object with setAlpha method
           if (typeof part.color.setAlpha === 'function') {
               part.color.setAlpha(alpha); // Modify alpha directly
               p.fill(part.color);
           } else {
                // Fallback if it's not a p5.Color object (e.g., just a string or array)
                // This might not work perfectly for all color formats
                p.fill(part.color.toString() + Math.round(alpha).toString(16).padStart(2, '0')); 
           }
           p.ellipse(part.x, part.y, currentSize, currentSize);
      } else if (part.color && alpha > 0 && currentSize > 0) {
            // Fallback for simple color values (like arrays or hex strings)
            const c = p.color(part.color); // Try to parse the color
            if (c) {
                 c.setAlpha(alpha);
                 p.fill(c);
                 p.ellipse(part.x, part.y, currentSize, currentSize);
            }
      }
    }
  };

  // --- Floating Score Functions --- 
  const emitFloatingScore = (scoreText, x, y) => {
    floatingScores.push({
      text: scoreText,
      x: x,
      y: y,
      vy: -1.5, // Move upwards
      life: 60, // Lasts for 60 frames (1 second)
      maxLife: 60,
    });
  };

  const updateFloatingScores = () => {
    for (let i = floatingScores.length - 1; i >= 0; i--) {
      let fs = floatingScores[i];
      fs.y += fs.vy;
      fs.life--;
      if (fs.life <= 0) {
        floatingScores.splice(i, 1);
      }
    }
  };

  const drawFloatingScores = () => {
    p.textAlign(p.CENTER, p.CENTER);
    p.strokeWeight(2);
    for (let fs of floatingScores) {
      const alpha = p.map(fs.life, 0, fs.maxLife, 0, 255); // Fade out
      const textSize = p.map(fs.life, fs.maxLife, fs.maxLife * 0.5 , 18, 24, true); // Start small, grow slightly
      p.textSize(textSize); 
      p.fill(255, 255, 255, alpha); // White text
      p.stroke(0, alpha); // Black outline
      p.text(fs.text, fs.x, fs.y);
    }
    p.noStroke(); // Reset stroke
    p.textSize(28); // Reset default text size for score
    p.textAlign(p.LEFT, p.TOP); // Reset alignment for score
  };

  // --- Helper Functions ---

  // Checks for collision between two rectangles (assumes rectMode(CENTER)).
  const rectRectCollision = (rect1, rect2) => {
      // Make sure rect dimensions are valid numbers
      const r1w = typeof rect1.width === 'number' ? rect1.width : 0;
      const r1h = typeof rect1.height === 'number' ? rect1.height : 0;
      const r2w = typeof rect2.width === 'number' ? rect2.width : 0;
      const r2h = typeof rect2.height === 'number' ? rect2.height : 0;

      return (
          rect1.x - r1w / 2 < rect2.x + r2w / 2 &&
          rect1.x + r1w / 2 > rect2.x - r2w / 2 &&
          rect1.y - r1h / 2 < rect2.y + r2h / 2 &&
          rect1.y + r1h / 2 > rect2.y - r2h / 2
      );
  }

  // Checks for collision between an ellipse (star) and a rectangle (player).
  const ellipseRectCollision = (ellipseObj, rectObj) => {
       // Make sure rect dimensions are valid numbers
      const rw = typeof rectObj.width === 'number' ? rectObj.width : 0;
      const rh = typeof rectObj.height === 'number' ? rectObj.height : 0;
      const esize = typeof ellipseObj.size === 'number' ? ellipseObj.size : 0;

      let closestX = p.constrain(ellipseObj.x, rectObj.x - rw / 2, rectObj.x + rw / 2);
      let closestY = p.constrain(ellipseObj.y, rectObj.y - rh / 2, rectObj.y + rh / 2);
      let distanceX = ellipseObj.x - closestX;
      let distanceY = ellipseObj.y - closestY;
      let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
      // Check against squared radius
      return distanceSquared < (esize / 2 * esize / 2);
  }

  // --- Game Logic Functions (now nested) ---

  // Handles player input for movement and jumping.
  const handleInput = () => {
      if (!player) return; // Guard clause
      // Prevent input if game over or level won screen is showing
      if (isGameOver || isGameWon) {
          player.velocityX = 0;
          return;
      }

      player.velocityX = 0;
      player.state = 'idle'; // Default to idle unless moving/jumping

      if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) { // 'A' key
          player.velocityX = -player.speed;
          if (player.isOnGround) player.state = 'run';
      }
      if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) { // 'D' key
          player.velocityX = player.speed;
          if (player.isOnGround) player.state = 'run';
      }

      // Update state based on vertical velocity if not explicitly running
       if (!player.isOnGround) {
           player.state = 'jump'; // Or 'fall' if you distinguish
       } else if (player.velocityX !== 0) {
           player.state = 'run';
       }
  }

  // Updates the player's position based on velocity and gravity.
  // Also handles sticking to moving platforms.
  const updatePlayer = () => {
       if (!player) return; // Guard clause

       // --- Sticking to Moving Platform --- 
       let platformMovementX = 0;
       let platformMovementY = 0;
       if (player.standingOnPlatform && player.standingOnPlatform.isMoving) {
           const platform = player.standingOnPlatform;
           if (platform.moveAxis === 'x') {
               platformMovementX = platform.moveSpeed * platform.moveDirection;
           }
           if (platform.moveAxis === 'y') {
                // Be careful with Y movement - might need adjustments if platform moves down fast
               platformMovementY = platform.moveSpeed * platform.moveDirection;
           }
       }
       // Reset platform link *before* applying velocity/gravity
       player.standingOnPlatform = null; 
       // --- End Sticking Logic --- 

       // --- Update Combo Perk Timer --- 
       if (player.comboPerkTimer > 0) {
           player.comboPerkTimer--;
           if (player.comboPerkTimer <= 0) {
               removeComboPerk(); // Call function to deactivate perk
           }
       }
       // --- End Combo Perk Timer ---

       // --- Update Powerup Timer --- 
       if (player.powerupTimer > 0) {
           player.powerupTimer--;
           if (player.powerupTimer <= 0) {
               removePowerup();
           }
       }
       // --- End Powerup Timer --- 

      player.velocityY += gravity;
      player.x += player.velocityX + platformMovementX; // Add platform movement
      player.y += player.velocityY + platformMovementY; // Add platform movement

      // --- Coyote Time Update ---
      if (player.isOnGround) {
          coyoteTimeCounter = COYOTE_TIME_DURATION;
      } else {
          coyoteTimeCounter--;
      }

      // --- Jump Buffer Update ---
      if (jumpBufferCounter > 0) {
          jumpBufferCounter--;
      }

      // Use p.height provided by the sketch instance
      if (player.y - player.height / 2 > p.height) {
          // Prevent falling death in God Mode
          if (isGodMode) {
              // Optionally teleport back up or just prevent game over
              player.y = p.height - player.height / 2 - 50; // Teleport above bottom
              player.velocityY = 0;
          } else if (!isGameOver) { // Play sound only once if not god mode
             playSound(gameOverSound);
             if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
             console.log("Game Over - Player fell off screen");
             isGameOver = true;
          }
          // isGameOver = true; // Moved inside the else block
      }

      // Use p.width provided by the sketch instance
      if (player.x - player.width / 2 < 0) {
          player.x = player.width / 2;
          player.velocityX = 0;
      }
      // REMOVED: Check that previously prevented player moving beyond the right edge of the initial screen.
      // The camera clamping now handles the right boundary visibility.
      /* 
      if (player.x + player.width / 2 > levelEndX) { // Optional: Add check against levelEndX if needed
          player.x = levelEndX - player.width / 2;
          player.velocityX = 0;
      }
      */

      // Update animation state
      if (!player.isOnGround) {
          player.state = 'jump';
      } else if (player.velocityX === 0) {
          player.state = 'idle';
      }
       // Note: 'run' state is set in handleInput

      // Reset ground state before collision checks
      player.isOnGround = false;

      // --- Visual Squash/Stretch (Subtle) ---
      if (!player.isOnGround && player.velocityY > 1.0) { // Falling
          player.visualHeight = player.baseHeight * 1.05;
          player.visualWidth = player.baseWidth * 0.95;
      } else if (player.isJumping && player.velocityY < -1.0) { // Rising
          player.visualHeight = player.baseHeight * 1.1;
          player.visualWidth = player.baseWidth * 0.9;
      } else {
          // Lerp back to normal size when grounded or velocity is low
          player.visualHeight = p.lerp(player.visualHeight, player.baseHeight, 0.2);
          player.visualWidth = p.lerp(player.visualWidth, player.baseWidth, 0.2);
      }
      // --- End Squash/Stretch ---

      // --- Star Magnet Logic (Part 1: Adjust radius based on perk) ---
      if (player.activeComboPerk === 'magnet' || player.activePowerup === 'starMagnet') {
          player.starMagnetRadius = 120; // Increased radius when magnet active
      } else {
          player.starMagnetRadius = 0; // Turn off magnet
      }
      // --- End Star Magnet Logic (Part 1) ---
   }

  // Updates enemy positions based on their patrol behavior OR shooting or charging behavior.
  const updateEnemies = () => {
       if (!enemies) return; // Guard clause
       const projectileSpeed = 4;
       const shootCooldownTime = 120; // Frames (2 seconds)
       const spotDistance = 250; // How far charger can see
       const spotOffsetY = 20; // How much higher/lower player can be to be spotted
       const spottingDuration = 30; // Frames (0.5 seconds)
       const chargeSpeed = 7;
       const chargeCooldownTime = 90; // Frames (1.5 seconds)

      for (let enemy of enemies) {
         if (!enemy) continue; // Skip if enemy is null/undefined

         // --- Basic X Movement (Patrol, Shooter, Charger Idle/Cooldown) ---
         // Only apply standard velocity if not actively charging
         if (enemy.chargeState !== 'charging') {
             enemy.x += enemy.velocityX;
             if (enemy.patrolStart !== undefined && enemy.patrolEnd !== undefined) {
                 if (enemy.x < enemy.patrolStart || enemy.x > enemy.patrolEnd) {
                     // Reverse direction only if not spotting or charging
                     if (enemy.chargeState !== 'spotting') { 
                        enemy.velocityX *= -1;
                     }
                     enemy.x = p.constrain(enemy.x, enemy.patrolStart, enemy.patrolEnd);
                 }
             }
         }
         // --- End Basic X Movement ---

         // --- Shooter Behavior --- 
         // Check for both shooter types (if you add more later, adjust this)
         if (enemy.type === 'shooter' || enemy.type === 'shooter_fox') { 
             if (!enemy.shootCooldown) {
                 enemy.shootCooldown = p.random(shootCooldownTime * 0.5, shootCooldownTime * 1.5); // Initialize cooldown randomly
             }
             enemy.shootCooldown--;

             if (enemy.shootCooldown <= 0) {
                 // Create a projectile
                 let projVelX = (enemy.velocityX > 0) ? projectileSpeed : -projectileSpeed; // Shoot in facing direction
                 projectiles.push({
                     x: enemy.x,
                     y: enemy.y,
                     vx: projVelX,
                     size: 10,
                     color: p.color(255, 100, 0) // Orange projectile
                 });
                 enemy.shootCooldown = shootCooldownTime + p.random(-30, 30); // Reset cooldown with slight variation
                 // Optional: Play shoot sound
                 // playSound(shootSound);
             }
         }
         // --- End Shooter Behavior ---

         // --- Charger Behavior (State Machine) ---
         if (enemy.type === 'charger') {
             // Initialize state if needed
             if (enemy.chargeState === undefined) {
                 enemy.chargeState = 'idle';
                 enemy.chargeCooldown = 0;
                 enemy.spottingTimer = 0;
             }

             // Cooldown state
             if (enemy.chargeState === 'idle' && enemy.chargeCooldown > 0) {
                 enemy.chargeCooldown--;
                 if (enemy.chargeCooldown <= 0) {
                     enemy.chargeState = 'idle'; // Ready to look again
                 }
             }
             // Idle / Looking state (only if not on cooldown)
             else if (enemy.chargeState === 'idle' && player) {
                 const distanceX = Math.abs(player.x - enemy.x);
                 const distanceY = Math.abs(player.y - enemy.y);
                 // Check LOS (within distance and Y-offset, facing player?)
                 const facingPlayer = (player.x < enemy.x && enemy.velocityX < 0) || (player.x > enemy.x && enemy.velocityX > 0);
                 if (distanceX < spotDistance && distanceY < enemy.height / 2 + spotOffsetY && facingPlayer) {
                     enemy.chargeState = 'spotting';
                     enemy.spottingTimer = spottingDuration;
                     enemy.originalVelocityX = enemy.velocityX; // Store original speed/direction
                     enemy.velocityX = 0; // Pause while spotting
                     console.log("Charger spotting player!");
                     // Optional: visual cue like color change
                 }
             }
             // Spotting state
             else if (enemy.chargeState === 'spotting') {
                 enemy.spottingTimer--;
                 if (enemy.spottingTimer <= 0) {
                     enemy.chargeState = 'charging';
                     // Charge in the direction the player was last seen
                     enemy.velocityX = (player.x < enemy.x ? -chargeSpeed : chargeSpeed);
                     console.log("Charger charging!");
                     // Optional: Play charge sound
                 }
             }
             // Charging state
             else if (enemy.chargeState === 'charging') {
                 enemy.x += enemy.velocityX; // Move fast!
                 // Check bounds collision while charging
                 if (enemy.patrolStart !== undefined && enemy.patrolEnd !== undefined) {
                     if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
                         enemy.chargeState = 'idle'; // Hit bound, go to cooldown
                         enemy.chargeCooldown = chargeCooldownTime;
                         enemy.velocityX = enemy.originalVelocityX !== undefined ? enemy.originalVelocityX : 1; // Restore original speed/direction or default
                         enemy.x = p.constrain(enemy.x, enemy.patrolStart, enemy.patrolEnd); // Clamp position
                         console.log("Charger hit bound, cooldown.");
                         // Optional: Play hit wall sound?
                     }
                 }
                 // TODO: Optional - Add check for hitting solid platforms/walls? 
             }
         }
         // --- End Charger Behavior ---
      }
  }

  // --- Projectile Functions ---
  const updateProjectiles = () => {
      for (let i = projectiles.length - 1; i >= 0; i--) {
          let proj = projectiles[i];
          proj.x += proj.vx;
          // Remove projectile if it goes off-screen
          if (proj.x < -proj.size || proj.x > p.width + proj.size) {
              projectiles.splice(i, 1);
          }
      }
  };

  const drawProjectiles = () => {
      p.noStroke();
      for (let proj of projectiles) {
          p.fill(proj.color);
          p.ellipse(proj.x, proj.y, proj.size, proj.size);
      }
  };
  // --- End Projectile Functions ---

  // Checks for collisions between player and platforms, stars, and enemies.
   const checkCollisions = () => {
       if (!player || !platforms || !stars || !enemies) return; // Guard clauses

      let landedThisFrame = false; // Flag to track landing

      // Player vs Platforms
      for (let platform of platforms) {
        if (!platform || platform.isVanished) continue; // Skip vanished platforms
        
        if (rectRectCollision(player, platform)) {
            let prevPlayerBottom = (player.y - player.velocityY) + player.height / 2;
            let platformTop = platform.y - platform.height / 2;

            // Check if landing on top
            if (player.velocityY >= 0 && prevPlayerBottom <= platformTop + 5 && !player.isOnGround) { // Only trigger landing once
                
                // --- Handle Different Platform Types --- 
                if (platform.type === 'bouncy') {
                    player.y = platformTop - player.height / 2; 
                    player.velocityY = player.jumpForce * (platform.bounceFactor || 1.5); // Apply bounce
                    player.isJumping = true;
                    player.isOnGround = false; // Not technically grounded
                    player.canDoubleJump = true; // Refresh double jump on bounce
                    playSound(jumpSound); // Bounce sound?
                    emitParticles(player.x, player.y + player.height / 2, 15, p.color(150, 255, 150, 180), { speed: 3, life: 30 });
                } else if (platform.type === 'crumbling') {
                    if (!platform.isCrumbling && !platform.isVanished) {
                         platform.isCrumbling = true;
                         platform.crumbleTimer = platform.crumbleTime || 90; // Start timer (frames)
                         console.log("Crumbling started!");
                         // Play crumble start sound?
                    }
                    // Regular landing logic for crumbling platform (before it disappears)
                    player.y = platformTop - player.height / 2; 
                    player.velocityY = 0; 
                    player.isJumping = false;
                    player.isOnGround = true;
                    player.canDoubleJump = false;
                    player.standingOnPlatform = platform;
                } else {
                    // --- Normal Platform Landing --- 
                    player.y = platformTop - player.height / 2; 
                    player.velocityY = 0; 
                    player.isJumping = false;
                    player.isOnGround = true;
                    player.canDoubleJump = false; 
                    player.standingOnPlatform = platform; // Link player to this platform
                    emitParticles(player.x, player.y + player.height / 2, 8, p.color(200, 200, 200, 100), { speed: 2, life: 20, size: 4 }); // Landing dust
                    // playSound(landSound); // Add landing sound if desired
                }
                // --- End Platform Type Handling --- 

                landedThisFrame = true; // Set landing flag regardless of platform type

                // Reset combo count ONLY when landing/bouncing on a new surface
                if (stompComboCount > 0) {
                    console.log(`Landed/Bounced, resetting combo from ${stompComboCount}`);
                }
                stompComboCount = 0; 
                break; // Stop checking other platforms for this frame after landing
            }
        } // End if rectRectCollision
      } // End platform loop

      // Player vs Stars
      for (let i = stars.length - 1; i >= 0; i--) {
          let star = stars[i];
          if (!star) continue; 
          if (!star.isCollected && ellipseRectCollision(star, player)) {
              star.isCollected = true;
              score += 10;
              playSound(coinSound); 
              // --- Enhanced Star Collection Feedback ---
              emitParticles(star.x, star.y, 35, p.color(255, 235, 50, 240), { speed: 4.5, life: 50, size: 12, gravity: 0.05 }); // Brighter, more particles, slight lift
              emitFloatingScore("+10", star.x, star.y - 20); // Emit score pop-up
              triggerShake(1.5, 8); // Gentle shake on star collect
          } else if (!star.isCollected && player.starMagnetRadius > 0) {
              // --- Star Magnet Logic (Part 2: Pull stars) ---
              const dx = player.x - star.x;
              const dy = player.y - star.y;
              const distSq = dx*dx + dy*dy;
              if (distSq < player.starMagnetRadius * player.starMagnetRadius) {
                  const dist = Math.sqrt(distSq);
                  const pullStrength = p.map(dist, 0, player.starMagnetRadius, 6, 1); // Stronger pull when closer
                  star.x += (dx / dist) * pullStrength;
                  star.y += (dy / dist) * pullStrength;
              }
              // --- End Star Magnet Logic (Part 2) ---
          }
      }

      // Player vs Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
          let enemy = enemies[i];
           if (!enemy) continue; 
          if (rectRectCollision(player, enemy)) {
              let prevPlayerBottom = (player.y - player.velocityY) + player.height / 2;
              let enemyTop = enemy.y - enemy.height / 2;

              // Check if player stomps the enemy 
              if (player.velocityY > 0.1 && prevPlayerBottom <= enemyTop + 10) { 
                  stompComboCount++; // Increment combo!
                  comboDisplayTimer = COMBO_DISPLAY_DURATION; // Reset display timer
                  
                  const baseScore = 50;
                  const comboScore = baseScore * stompComboCount; // Score increases with combo
                  score += comboScore;

                  let enemyX = enemy.x; 
                  let enemyY = enemy.y;
                  enemies.splice(i, 1); 
                  
                  player.velocityY = player.jumpForce * 0.75; // Slightly stronger bounce
                  player.isJumping = true;
                  player.isOnGround = false; // Important: Don't reset combo here!
                  player.canDoubleJump = true; 
                  player.state = 'jump';
                  
                  // --- Player bounce squash/stretch ---
                  player.visualHeight = player.baseHeight * 0.8; 
                  player.visualWidth = player.baseWidth * 1.2;
                  
                  // Sound with pitch shift based on combo
                  const pitch = 1.0 + stompComboCount * 0.05;
                  if (defeatSound && defeatSound.isLoaded()) {
                      defeatSound.rate(pitch); // Increase pitch
                  }
                  playSound(defeatSound); 

                  // More particles/shake with combo?
                  const particleCount = 25 + stompComboCount * 5; // More particles based on combo
                  const shakeIntensityValue = 3 + stompComboCount * 0.8; // Increased shake intensity with combo
                  emitParticles(enemyX, enemyY, particleCount, p.color(150, 0, 0, 200), { speed: 4.5, life: 45, size: 8, gravity: 0.2 }); // Enemy defeat poof!
                  triggerShake(shakeIntensityValue, 15 + stompComboCount * 2); // Trigger shake, longer duration with combo
                  emitFloatingScore(`+${comboScore} (x${stompComboCount})`, enemyX, enemyY - 20); // Show combo score

                  // --- Check for Combo Perk Activation ---
                  checkComboPerks(stompComboCount);
                  // --- End Combo Perk Check ---

              } else if (!landedThisFrame) { // Only game over if not landing simultaneously and not stomping
                  // Collided from side or bottom - Game Over (unless invincible/god mode)
                  // Check for Invincibility (Powerup OR God Mode)
                  if (player.activePowerup === 'invincibility' || isGodMode) {
                      console.log("Player invincible to enemy collision");
                      // Optionally push player away slightly?
                      // Or just do nothing and let them phase through?
                      // Let's just ignore damage for now.
                  } else if (!isGameOver) { 
                     playSound(gameOverSound);
                     triggerShake(8, 30); // Strong shake on getting hit
                     if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                     console.log("Game Over - Player hit enemy");
                     isGameOver = true;
                     stompComboCount = 0; // Reset combo on game over
                     comboDisplayTimer = 0;
                     break; 
                  }
              }
          }
      }
      // --- Player vs Projectiles --- 
      if (player && !isGameOver) { // Only check if player exists and not already game over
          for (let i = projectiles.length - 1; i >= 0; i--) {
              let proj = projectiles[i];
              // Simple circle-rect collision (using player rect, projectile ellipse)
              let closestX = p.constrain(proj.x, player.x - player.width / 2, player.x + player.width / 2);
              let closestY = p.constrain(proj.y, player.y - player.height / 2, player.y + player.height / 2);
              let distanceX = proj.x - closestX;
              let distanceY = proj.y - closestY;
              let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
              
              if (distanceSquared < (proj.size / 2 * proj.size / 2)) {
                  // Collision detected!
                  // Check for Invincibility (Powerup OR God Mode)
                  if (player.activePowerup === 'invincibility' || isGodMode) {
                      projectiles.splice(i, 1); // Destroy projectile, player is safe
                      console.log("Player invincible to projectile");
                      continue; // Skip game over logic
                  }
                  if (!isGameOver) { 
                     playSound(gameOverSound); // Use the same sound as hitting an enemy for now
                     triggerShake(6, 25); // Shake on projectile hit
                     if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                     console.log("Game Over - Player hit by projectile");
                  }
                  isGameOver = true;
                  stompComboCount = 0; // Reset combo
                  comboDisplayTimer = 0;
                  projectiles.splice(i, 1); // Remove the projectile that hit
                  // Maybe add hit particle effect?
                  emitParticles(player.x, player.y, 30, p.color(255, 0, 0, 200), { speed: 4, life: 40, size: 7 });
                  break; // Exit loop once hit
              }
          }
      }
      // --- End Player vs Projectiles --- 

      // --- Player vs Hazards ---
      if (player && !isGameOver) { 
          const spikeHeight = 15; // Same as in drawHazards
          for (let hazard of hazards) {
              if (hazard.type === 'spikes') {
                  // Define the bounding box for the spike group
                  const hazardRect = {
                      x: hazard.x, // Center X
                      y: hazard.y - spikeHeight / 2, // Center Y (mid-height of spike)
                      width: hazard.width,
                      height: spikeHeight
                  };
                  
                  if (rectRectCollision(player, hazardRect)) {
                      // Collision detected!
                      // Check for Invincibility (Powerup OR God Mode)
                      if (player.activePowerup === 'invincibility' || isGodMode) {
                          // Let's make hazards non-lethal with invincibility/god mode
                          if (hazard.type === 'spikes' || hazard.type === 'lava') {
                              console.log(`Player invincible, ignored ${hazard.type}`);
                              continue; // Skip game over for this hazard
                          }
                      }
                      if (!isGameOver) { 
                         playSound(gameOverSound); // Use same sound
                         triggerShake(12, 40); // Very strong shake for spikes
                         if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                         console.log("Game Over - Player hit hazard (spikes)");
                      }
                      isGameOver = true;
                      stompComboCount = 0; // Reset combo
                      comboDisplayTimer = 0;
                      // Maybe add hit particle effect?
                      emitParticles(player.x, player.y, 30, p.color(180, 180, 180, 200), { speed: 4, life: 40, size: 7 });
                      break; // Exit loop once hit
                  }
              } else if (hazard.type === 'lava') {
                  const hazardRect = {
                      x: hazard.x,
                      y: hazard.y,
                      width: hazard.width,
                      height: hazard.height
                  };
                  if (rectRectCollision(player, hazardRect)) {
                      if (player.activePowerup === 'invincibility') {
                          // Player is safe, maybe destroy hazard or just ignore?
                          // For lava, still game over?
                          // Let's make lava non-lethal with invincibility for now
                          console.log("Player invincible, ignored lava");
                          continue; // Skip game over for lava
                      }
                      if (!isGameOver) { 
                         playSound(gameOverSound); // Use same sound
                         triggerShake(12, 40); // Very strong shake for lava
                         if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                         console.log("Game Over - Player hit hazard (lava)");
                      }
                      isGameOver = true;
                      stompComboCount = 0; 
                      comboDisplayTimer = 0;
                      emitParticles(player.x, player.y, 50, p.color(255, 100, 0, 220), { speed: 6, life: 60, size: 12, gravity: -0.15 }); // More lava particles
                      break; 
                  }
              } else if (hazard.type === 'single_spike') {
                  p.fill(150, 150, 150); // Grey color for spikes
                  const spikeWidth = hazard.width || 15;
                  const sHeight = hazard.height || 10;
                  // Draw upward pointing triangle at hazard x,y (assuming y is base)
                   p.triangle(
                      hazard.x - spikeWidth / 2, hazard.y,         // Bottom-left
                      hazard.x + spikeWidth / 2, hazard.y,         // Bottom-right
                      hazard.x, hazard.y - sHeight                 // Top point
                  );
              }
          }
      }
      // --- End Player vs Hazards --- 

      // --- Player vs Powerups --- 
      if (player && !isGameOver) { 
          for (let i = powerups.length - 1; i >= 0; i--) {
              let pow = powerups[i];
              if (!pow.isCollected) {
                  // Simple distance check for collection
                  const distSq = (player.x - pow.x)*(player.x - pow.x) + (player.y - pow.y)*(player.y - pow.y);
                  const collectRadiusSq = (player.width / 2 + 15)*(player.width / 2 + 15); // Slightly larger than powerup size
                  if (distSq < collectRadiusSq) {
                      pow.isCollected = true;
                      applyPowerup(pow.type);
                      emitParticles(pow.x, pow.y, 20, p.color(100, 255, 100, 180), { speed: 3, life: 30, size: 6 });
                      // Don't break, could potentially collect multiple if overlapping?
                  }
              }
          }
      }
      // --- End Player vs Powerups --- 
  }

  // --- Combo Perk Functions ---
  const COMBO_PERK_DURATION = 240; // Frames (4 seconds)

  const checkComboPerks = (comboCount) => {
      if (!player) return;

      let newPerk = null;
      if (comboCount >= 10) {
          newPerk = 'magnet';
      } else if (comboCount >= 5) {
          newPerk = 'speed';
      }

      // Activate perk only if it's new or different from the current one
      if (newPerk && newPerk !== player.activeComboPerk) {
          activateComboPerk(newPerk);
      }
      // Extend timer if the same perk tier is reached again
      else if (newPerk && newPerk === player.activeComboPerk) {
          player.comboPerkTimer = COMBO_PERK_DURATION; // Refresh timer
          console.log(`Combo Perk Refreshed: ${newPerk}`);
      }
  };

  const activateComboPerk = (perkType) => {
      if (!player) return;
      removeComboPerk(); // Remove existing perk first

      player.activeComboPerk = perkType;
      player.comboPerkTimer = COMBO_PERK_DURATION;
      console.log(`Combo Perk Activated: ${perkType}`);
      // Add visual/audio cue for perk activation
      triggerShake(4, 20);
      emitParticles(player.x, player.y - player.height / 2, 30, p.color(255, 255, 100, 200), { speed: 3.5, life: 40, size: 7 });
      // playSound(perkActivateSound); // Optional: Add a specific sound

      // Apply perk effect
      if (perkType === 'speed') {
          player.speed = player.baseSpeed * 1.4; // Apply speed boost
      } else if (perkType === 'magnet') {
          player.starMagnetRadius = 120; // Activate magnet radius
      }
  };

  const removeComboPerk = () => {
      if (!player || !player.activeComboPerk) return;
      console.log(`Combo Perk Expired: ${player.activeComboPerk}`);
      
      // Revert specific perk effect
      if (player.activeComboPerk === 'speed') {
          player.speed = player.baseSpeed; // Revert speed
      }
      if (player.activeComboPerk === 'magnet') {
         player.starMagnetRadius = 0; // Deactivate magnet
      }
      // Note: We don't reset combo perk timer here, it runs down naturally
      player.activeComboPerk = null;
      // Remove visual cue if needed
  };
  // --- End Combo Perk Functions ---

  // Checks if all stars have been collected to trigger the win condition.
  const checkWinCondition = () => {
      // --- MODIFIED: Early exit logic --- 
      // Exit if game over, already won, or if there are no stars to collect
      if (isGameOver || isGameWon || !stars || stars.length === 0) {
          return;
      }
      
      // --- Star Collection Check --- 
      let allStarsCollected = true;
      for (let star of stars) {
          if (!star || !star.isCollected) { // Check if star exists and is collected
              allStarsCollected = false;
              break;
          }
      }
      
      // --- Win Condition based ONLY on stars --- 
      if (allStarsCollected) {
         console.log("[WinCheck] All stars collected! Setting isGameWon = true."); // <-- ADDED LOG
         isGameWon = true; // Mark current level as won
         playSound(victorySound);
         if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
         console.log(`Generated Level ${currentLevelIndex + 1} Complete!`);
         
         // --- INFINITE PART ---
         // Immediately load next level after a short delay
         console.log("[WinCheck] Starting 2-second timeout for next level..."); // <-- ADDED LOG
         setTimeout(() => {
             console.log("[WinCheck] Timeout finished! Loading next level."); // <-- ADDED LOG
             currentLevelIndex++;
             loadLevelData(currentLevelIndex); // Load the next generated level
         }, 2000); // 2 second delay before next level
      }
  }

  // --- Drawing Functions (now nested) ---

  const drawPlayer = () => {
      if (!player || !nootIdleImg) return; // Guard clause for player and image

      p.push(); // Isolate drawing settings
      p.translate(player.x, player.y);
      p.imageMode(p.CENTER); // Draw image from its center

      // --- Invincibility / God Mode Visual Cue --- 
      if (isGodMode) {
          // Simple tint for god mode - distinct from powerup maybe?
          p.tint(200, 200, 255, 230); // Light blue tint
      } else if (player.activePowerup === 'invincibility') {
          // Flicker effect for powerup
          if (p.frameCount % 10 < 5) {
              p.tint(255, 255, 255, 150); // Slightly transparent
          } else {
              p.tint(255, 255, 255, 255); // Normal
          }
      } else {
          p.noTint(); // Ensure tint is off otherwise
      }
      // --- End Visual Cue --- 

      // Determine which image to use based on state
      let currentImg = nootIdleImg; // Default to idle
      // --- IMPORTANT: Check if run/jump images are actually loaded --- 
      // You need to uncomment the loading lines in preload() and assign them
      // const nootRunImg = p.loadImage(...); 
      // const nootJumpImg = p.loadImage(...);

      // Example logic (using idle img as placeholder):
      if (player.state === 'jump') { 
          // currentImg = nootJumpImg || nootIdleImg; // Use jump if available, else idle
          currentImg = nootIdleImg; // Placeholder
      }
      else if (player.state === 'run') { 
          // currentImg = nootRunImg || nootIdleImg; // Use run if available, else idle
          currentImg = nootIdleImg; // Placeholder
      }

      // Flip image based on direction
      if (player.velocityX < 0) {
          p.scale(-1, 1); // Flip horizontally
      }

      // Draw the Noot image instead of the ellipse
      // Use player dimensions for the image size
      p.image(currentImg, 0, 0, player.width, player.height);

      p.noTint(); // Always ensure tint is reset after drawing player
      p.pop(); // Restore previous drawing settings
  }

  const drawPlatformsWithTexture = () => {
    // Fallback and platform colors
    const platformColor = p.color(242, 210, 169, 255); // Solid sand color
    const bouncyColor = p.color(180, 255, 180, 220); // Light green for bouncy
    const crumblingColor = p.color(200, 160, 120, 200); // Dusty brown for crumbling
    
    // Guard clause
    if (!platforms) return;
    
    p.push(); // Isolate settings
    p.rectMode(p.CENTER);
    p.noStroke();
    
    for (let platform of platforms) {
        if (!platform || platform.isVanished) continue; // Don't draw vanished platforms

        let drawX = platform.x;
        let drawY = platform.y;
        let alpha = 255;

        // Visual effect for crumbling
        if (platform.isCrumbling) {
            const shakeAmount = platform.crumbleTimer > 0 ? Math.sin(p.frameCount * 0.5) * (2 * (1 - platform.crumbleTimer / (platform.crumbleTime || 90))) : 0;
            drawX += p.random(-shakeAmount, shakeAmount);
            drawY += p.random(-shakeAmount, shakeAmount);
            // Fade out slightly as it crumbles
            alpha = platform.crumbleTimer > 0 ? p.map(platform.crumbleTimer, (platform.crumbleTime || 90), 0, 255, 150) : 255;
        }
        
        // Select color based on type
        let currentColor;
        if (platform.type === 'bouncy') {
            currentColor = bouncyColor;
        } else if (platform.type === 'crumbling') {
            currentColor = crumblingColor;
        } else {
            currentColor = platformColor;
        }
        
        // Apply alpha if crumbling
        if (platform.isCrumbling) {
             // Create a new color object to set alpha without modifying the original
             let tempColor = p.color(currentColor);
             tempColor.setAlpha(alpha);
             p.fill(tempColor);
        } else {
            p.fill(currentColor);
        }

        // Draw the platform
        p.rect(drawX, drawY, platform.width, platform.height);
    }
    
    p.pop(); // Restore settings
  };

  const drawDecorations = () => {
    if (!decorations) return;
    p.imageMode(p.CENTER); // Assume center mode for decorations
    for (let dec of decorations) {
        if (dec && dec.img) {
            p.image(dec.img, dec.x, dec.y);
        }
    }
  };

  const drawStars = () => {
       if (!stars) return; // Guard clause
      p.noStroke();
      for (let star of stars) {
          if (!star) continue; // Skip if star is null/undefined
          if (!star.isCollected) {
              // Pulsating brightness/size for stars
              const pulse = p.sin(p.frameCount * 0.08 + star.x * 0.1) * 0.1 + 1.0;
              const starBrightness = p.map(pulse, 0.9, 1.1, 200, 255);
              const starSize = star.size * p.map(pulse, 0.9, 1.1, 0.95, 1.05);
              p.fill(255, starBrightness, 0); // Yellow/Orange pulsating color
              p.push();
              p.translate(star.x, star.y);
              p.rotate(p.frameCount * 0.02); // Gentle rotation
              // Draw a 5-pointed star
              p.beginShape();
              for (let i = 0; i < 5; i++) {
                  let angle = p.TWO_PI / 5 * i - p.HALF_PI; // Outer point angle
                  let xOuter = p.cos(angle) * starSize / 2;
                  let yOuter = p.sin(angle) * starSize / 2;
                  p.vertex(xOuter, yOuter);
                  angle += p.TWO_PI / 10; // Inner point angle
                  let xInner = p.cos(angle) * starSize / 4; // Inner radius
                  let yInner = p.sin(angle) * starSize / 4;
                  p.vertex(xInner, yInner);
              }
              p.endShape(p.CLOSE);
              p.pop();
          }
      }
  }

  const drawEnemies = () => {
      if (!enemies) return; // Guard clause
      const fallbackColor = p.color(255, 0, 0, 150); // Semi-transparent red

      p.push();
      p.rectMode(p.CENTER); // Ensure rect fallback draws correctly
      p.imageMode(p.CENTER);

      for (let enemy of enemies) {
          if (!enemy) continue;

          if (!enemy.img || !enemy.img.width || enemy.img.height <= 0) {
              // --- Fallback Drawing --- 
              // Only log once per enemy type maybe? For now, log each instance
              console.warn(`drawEnemies: Image invalid for enemy at (${enemy.x.toFixed(0)}, ${enemy.y.toFixed(0)}), drawing fallback rect.`);
              p.fill(fallbackColor);
              p.noStroke();
              p.rect(enemy.x, enemy.y, enemy.width, enemy.height);
              // --- End Fallback --- 
          } else {
             // --- Original Image Drawing --- 
             p.push();
             p.translate(enemy.x, enemy.y);
             
             // Flip enemy image based on its direction
             if (enemy.velocityX > 0) { // Facing right
                 p.scale(-1, 1);
             } // No need for else, default is facing left
             
             // Draw the enemy image using its dimensions
             p.image(enemy.img, 0, 0, enemy.width, enemy.height);
             
             p.pop(); // Restore individual enemy transform
             // --- End Original Image Drawing --- 
          }
      }
      p.pop(); // Restore general settings
  }

  const drawScore = () => {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(3);
      p.textSize(28);
      p.textAlign(p.LEFT, p.TOP); // Align top-left
      p.text("Score: " + (score || 0), 20, 20); // Display score or 0 if undefined
      p.textAlign(p.CENTER, p.CENTER); // Reset alignment
      p.noStroke(); // Reset stroke
  }

  const drawComboDisplay = () => {
    if (comboDisplayTimer > 0 && stompComboCount > 0) {
      comboDisplayTimer--;
      const alpha = p.map(comboDisplayTimer, 0, COMBO_DISPLAY_DURATION, 0, 255); // Fade out
      // Make text size grow more significantly with combo
      const baseSize = 28;
      const growthFactor = 1 + Math.min(stompComboCount, 10) * 0.2; // Grow up to 3x size for combo 10+
      const textSize = baseSize * growthFactor;
      const yPos = 70; // Position below main score
      
      p.push(); // Isolate text settings
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(textSize);
      p.strokeWeight(3 + Math.min(stompComboCount, 5)); // Thicker stroke for higher combo
      // Color shifts towards red/orange with higher combo
      const comboColor = p.lerpColor(p.color(255, 223, 0), p.color(255, 100, 0), Math.min(stompComboCount / 10, 1));
      comboColor.setAlpha(alpha);
      p.fill(comboColor); // Gold -> Orange color, fading out
      p.stroke(0, alpha); // Black outline, fading out
      p.text(`Combo x${stompComboCount}`, 20, yPos);
      p.pop(); // Restore default text settings
    }
  };

  // --- Game State Management (now nested) ---

  // Function to generate level data procedurally
  const generateLevel = (levelIndex) => {
    // Import the generator from mario-generator.js
    const generator = require('./mario-generator');
    // Create an assets object to pass
    const assets = {
        enemyFoxImg: enemyFoxImg,       // Pass the loaded image variable
        enemyRabbitImg: enemyRabbitImg, // Pass the loaded image variable
        // Add other assets if needed by the generator later
    };
    // Use the external generator with proper parameters, including assets
    return generator.generateLevel(levelIndex, p, player, player.baseJumpForce, assets);
  };

  // --- ACTUAL GAME SETUP AND INITIALIZATION ---

  // Function to load data for a specific level index (NOW USES GENERATOR)
  const loadLevelData = (levelIndex) => {
      // Generate the level configuration
      const level = generateLevel(levelIndex);
      const difficulty = levelIndex + 1; // Used for enemy init potentially
      
      // --- Select and Assign Background ---
      if (backgroundSets.length > 0) {
          currentBackgroundSetIndex = levelIndex % backgroundSets.length;
          const currentSet = backgroundSets[currentBackgroundSetIndex];
          console.log(`Using background set: ${currentSet.name} for level ${levelIndex + 1}`);
          // Assign the layers from the selected set
          bgLayer1 = currentSet.layers.layer1;
          bgLayer2 = currentSet.layers.layer2;
          bgLayer3 = currentSet.layers.layer3;
          bgLayer4 = currentSet.layers.layer4;
      } else {
          console.error("Cannot set background, no sets available!");
          // Maybe set fallbacks to null or solid color?
          bgLayer1 = bgLayer2 = bgLayer3 = bgLayer4 = null;
      }

      // --- Initialize based on GENERATED level data --- 
      platforms = level.platforms.map(platformData => ({
          ...platformData, 
          color: p.color(100, 200, 100), // Assign default color directly
          // Initialize timers and vanished state for crumbling platforms
          isVanished: false,
          isCrumbling: false,
          crumbleTimer: 0,
          respawnTimer: 0,
          vanishTime: 0,
          // Initialize moveDirection for moving platforms
          moveDirection: platformData.isMoving ? (platformData.initialMoveDirection || 1) : undefined 
      }));
      stars = level.stars.map(s => ({ ...s, isCollected: false, color: p.color(255, 223, 0) }));
      hazards = level.hazards ? level.hazards.map(h => ({ ...h })) : []; // Load hazards
      powerups = level.powerups ? level.powerups.map(pow => ({ ...pow, isCollected: false })) : []; // Load powerups
      // levelGoal = level.goal ? { ...level.goal, isReached: false } : null; // Load the goal object if it exists - REMOVED
      
      // Initialize enemies, using the images assigned during generation
      enemies = [];
      if (level.enemies) { // Images should be assigned in generateLevel now
          enemies = level.enemies.map(e => {
               // Initialize cooldown for shooters
              let initialCooldown = (e.type === 'shooter') ? p.random(30, 120 - difficulty * 5) : undefined; // Cooldown potentially shorter at high levels
              
              // Convert image string references to actual image objects
              let actualImg;
              if (e.img === 'enemyFoxImg') {
                  actualImg = enemyFoxImg;
              } else if (e.img === 'enemyBirdImg') {
                  actualImg = enemyBirdImg;
              } else if (e.img === 'enemyRabbitImg') {
                  actualImg = enemyRabbitImg;
              }
              
              return { 
                  ...e, 
                  velocityX: e.velocityX || 1, 
                  shootCooldown: initialCooldown,
                  img: actualImg // Replace string reference with actual image object
              };
          });
      }

      // Player start position
      if (player) {
          player.x = level.playerStart.x;
          player.y = level.playerStart.y;
          player.velocityX = 0;
          player.velocityY = 0;
          player.isJumping = false;
          player.isOnGround = false;
          player.canDoubleJump = false;
          player.state = 'idle';
          player.standingOnPlatform = null; 
      } else {
          initializePlayer(level.playerStart); // Pass start pos to initializer
      }

      // Decorations (could also be proceduralized later)
      initializeDecorations(); // Keep decorations simple for now

      // Reset level state
      isGameOver = false;
      isGameWon = false; // Reset level win flag
      stompComboCount = 0;
      comboDisplayTimer = 0;
      particles = [];
      floatingScores = [];
      projectiles = [];
      if (player) { 
          removePowerup(); // Reset player powerup state
      } 

      // <-- ADDED LOGS
      console.log(`Loaded generated level ${levelIndex + 1} data:`);
      console.log(`  - Platforms: ${platforms ? platforms.length : 'N/A'}`);
      console.log(`  - Stars: ${stars ? stars.length : 'N/A'}`);
      console.log(`  - Enemies: ${enemies ? enemies.length : 'N/A'}`);
      console.log(`  - Hazards: ${hazards ? hazards.length : 'N/A'}`);
      console.log(`  - Powerups: ${powerups ? powerups.length : 'N/A'}`);
      console.log(`  - Available Background Sets: ${backgroundSets ? backgroundSets.length : 'N/A'}`); // <-- Log available sets
      // End Added Logs

      // Estimate level end based on the last platform generated
      if (platforms && platforms.length > 0) {
          levelEndX = platforms[platforms.length - 1].x + p.width / 2; // Allow camera to see a bit past the last platform
      } else {
          levelEndX = p.width; // Fallback if no platforms
      }
      console.log(`[LoadLevel] Estimated level end X: ${levelEndX.toFixed(0)}`);

      // Ensure game over flag is reset *here* as well, redundant but safe.
      isGameOver = false; 
      isGameWon = false;

      // Restart background music
      if (soundsLoaded && bgMusic && bgMusic.isLoaded()) {
          if (bgMusic.isPlaying()) bgMusic.stop();
          bgMusic.setVolume(internalMasterVolume); // Use internal volume
          bgMusic.loop();
      }
  };

  const resetGame = () => {
      score = 0; // Reset score only at the very beginning or full restart
      currentLevelIndex = 0;
      isGameComplete = false; // This flag might become less relevant unless you add a max level
      // --> Explicitly reset game state flags before loading <--
      isGameOver = false;
      isGameWon = false;
      // Reset other states if necessary (like player powerups immediately)
      if (player) removePowerup();
      particles = [];
      floatingScores = [];
      projectiles = [];
      // --> End explicit reset <--
      loadLevelData(currentLevelIndex); // Load the first generated level
      // Music is handled within loadLevelData
      console.log("Game Reset!");
  }

   // Helper function to initialize player
   const initializePlayer = (startPos = null) => {
       const baseSpeed = 5.5; // Increased base speed
       const baseJumpForce = -13; // Keep the increased jump force
       player = {
          x: startPos ? startPos.x : p.width / 2,
          y: startPos ? startPos.y : p.height - 100,
          width: 45, // Adjusted size for Noot image
          height: 55, // Adjusted size for Noot image
          velocityX: 0,
          velocityY: 0,
          speed: baseSpeed,
          baseSpeed: baseSpeed, // Store base value
          jumpForce: jumpForce, // Use the initialized jumpForce
          baseJumpForce: jumpForce, // Store the initialized value as base
          isJumping: false,
          isOnGround: false,
          canDoubleJump: false,
          color: p.color(50, 150, 255), // Keep color for fallback maybe?
          state: 'idle',
          standingOnPlatform: null, // Reference to the platform the player is currently standing on
          activePowerup: null, // { type: 'speedBoost', timer: 180 }
          powerupTimer: 0,
          baseHeight: 55, // Store base height
          baseWidth: 45, // Store base width
          visualHeight: 55, // For drawing squash/stretch
          visualWidth: 45, // For drawing squash/stretch
          // Combo Perk Tracking
          comboPerkTimer: 0,
          activeComboPerk: null, // e.g., 'speed', 'magnet'
          starMagnetRadius: 0, // Base magnet radius (0 = off)
       };
   }

  const initializeDecorations = () => {
    decorations = []; // Clear existing decorations
    if (decorationTree1) { // Ensure image is loaded
        // Example placement, can be adjusted or made procedural
        decorations.push({ img: decorationTree1, x: p.random(50, 150), y: p.height - 80 - p.random(40) });
        decorations.push({ img: decorationTree1, x: p.random(p.width - 150, p.width - 50), y: p.height - 80 - p.random(40) });
        // Add more based on level size or randomly?
        const numDecor = Math.floor(p.width / 300); // Add one tree every 300 pixels roughly
        for (let i = 0; i < numDecor; i++) {
             // Avoid placing directly over player start or potential end goal areas
             let potentialX = p.random(200, p.width - 200);
             // Try to place near platforms, but not directly on them
             let platformY = p.height - 80; // Default to near ground
             let closestPlatDist = Infinity;
             for(let plat of platforms) {
                 if (Math.abs(plat.x - potentialX) < closestPlatDist && !plat.isGround) {
                    closestPlatDist = Math.abs(plat.x - potentialX);
                    // Place decoration slightly below the platform it's closest to horizontally
                    platformY = plat.y + plat.height/2 + 40 + p.random(20); 
                 }
             }
             // Clamp Y position
             platformY = p.constrain(platformY, 100, p.height - 80);
             decorations.push({ img: decorationTree1, x: potentialX, y: platformY });
        }
    }
  };

  // --- Parallax Background Function --- 
  const drawBackground = () => {
      // Check the dynamically assigned bgLayer variables
      if (!bgLayer1 || !bgLayer2 || !bgLayer3 || !bgLayer4) {
          // Optional: Draw a solid color if backgrounds failed to load
          p.background(100, 150, 200); // Default blue sky color?
          return;
      }

      p.imageMode(p.CORNER); // Use corner mode for background tiling

      const factor1 = 0.1;
      const factor2 = 0.3;
      const factor3 = 0.6;
      const factor4 = 1.0; 

      let cameraX = player ? player.x : p.width / 2;

      // Function to draw a tiled layer
      const drawLayer = (img, factor) => {
         if (!img || !img.width || img.width <= 0) {
             console.warn(`[Background] Invalid image or width for layer with factor ${factor}. Skipping draw.`); // <-- ADDED WARNING
             return; 
         }
          const imgWidth = img.width;
          // Calculate the offset based on camera and factor
          // Modulo ensures the offset wraps around, creating the loop
          let offsetX = (cameraX * factor) % imgWidth;
         if (p.frameCount % 120 === 1 && factor === 0.6) { // Log only layer 3 info once every 2 seconds
             console.log(`[Background] Layer 3: cameraX=${cameraX.toFixed(1)}, imgWidth=${imgWidth}, offsetX=${offsetX.toFixed(1)}`); // <-- ADDED LOG
         }

          // Draw the image twice to cover the screen during wrap-around
          // Use p.height for the height argument to fill the canvas vertically
          p.image(img, -offsetX, 0, imgWidth, p.height);
          p.image(img, imgWidth - offsetX, 0, imgWidth, p.height);
      };

      // Draw layers using the current bgLayer variables
      drawLayer(bgLayer1, factor1);
      drawLayer(bgLayer2, factor2);
      drawLayer(bgLayer3, factor3);
      drawLayer(bgLayer4, factor4);

      p.imageMode(p.CENTER); // Reset to center mode
  };

  // p5.js setup function: Initializes the game environment and objects.
  p.setup = () => {
      p.createCanvas(800, 600);
      p.rectMode(p.CENTER);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.fill(255);

      // Initialize parameters
      gravity = 0.6;
      jumpForce = -13; // Increased jump force
      doubleJumpForce = -11; // Increased double jump force
      // internalMasterVolume is now controlled by props

      // Player needs to be initialized *before* generateLevel is called
      // so generateLevel can access base stats if needed.
      initializePlayer({ x: 100, y: p.height - 100}); 
      
      // Initialize game objects by loading/generating the first level
      resetGame(); // Calls loadLevelData(0) internally

      console.log("p5 setup complete. Procedural generation active. Interaction needed for audio context.");
  };

  // p5.js draw function: Called repeatedly to update and render the game frame.
  p.draw = () => {
      // --- Camera Update --- 
      // Simple horizontal follow, centered on player, clamped to level bounds
      let targetCameraX = player ? player.x : p.width / 2;
      // Clamp camera between start (half screen width) and estimated end (levelEnd - half screen width)
      // Smooth camera movement with lerp
      const cameraLerpFactor = 0.08; // Adjust for desired smoothness (lower = smoother/slower)
      let clampedTargetX = p.constrain(targetCameraX, p.width / 2, levelEndX - p.width / 2);
      cameraX = p.lerp(cameraX, clampedTargetX, cameraLerpFactor);
      // For now, no vertical camera movement: cameraY = p.height / 2; 
      
      // --- Update Screen Shake ---
      updateShake();
      // --- End Update Screen Shake ---
      
      drawBackground(); // Draw parallax background first (uses its own offset calculation)
      drawDecorations(); // Draw decorations on top of background (these currently don't move with camera, might need adjustment)

      // --- Game Logic Updates --- 
      updatePlayer();
      updateEnemies();
      updatePlatforms(); // Update platform positions
      checkCollisions();
      checkWinCondition(); // Now handles infinite progression
      updateParticles(); 
      updateProjectiles(); // Add projectile updates
      updateFloatingScores(); // Update floating scores BEFORE drawing

      // --- ADDED LOGS (before drawing) ---
      if (p.frameCount % 120 === 0) { // Log counts every 2 seconds to avoid spam
          console.log(`Draw loop counts (Lvl ${currentLevelIndex+1}): Plat=${platforms?.length}, Star=${stars?.length}, Enemy=${enemies?.length}`);
      }
      // --- END ADDED LOGS ---

      // --- Apply Camera Translation --- 
      p.push(); // Isolate camera translation
      // Add screen shake offset *before* camera translation for world shake effect
      p.translate(currentShakeX, currentShakeY);
      // Translate the world so the camera position is centered
      p.translate(-cameraX + p.width / 2, 0); // Only horizontal scroll for now

      // --- Drawing Game Elements (Now inside translated view) --- 
      drawPlatformsWithTexture();
      drawStars();
      drawEnemies(); 
      drawHazards(); // Draw hazards
      drawPlayer(); 
      drawParticles(); 
      drawProjectiles(); // Add projectile drawing
      drawPowerups(); // Draw powerups
      
      // --- End shake effect scope - REMOVED ---
      // p.pop(); 

      p.pop(); // Restore view before drawing UI
      // --- End Camera Translation --- 

      // --- Draw UI Elements (Outside camera translation) --- 
      handleInput(); // Process input 
      updateFloatingScores(); // Update scores 
      drawScore(); // Draw score overlay 
      drawFloatingScores(); // Draw floating scores 
      drawComboDisplay(); // Draw combo text

      // --- Game Over / Win Screens --- 
      if (isGameOver) {
          p.fill(255, 0, 0, 200); // Red overlay
          p.rect(p.width / 2, p.height / 2, p.width, p.height);
          p.fill(255);
          p.stroke(0);
          p.strokeWeight(3);
          p.textSize(60);
          p.text("GAME OVER!", p.width / 2, p.height / 2 - 40);
          p.textSize(30);
          // Display generated level number
          p.text("Level: " + (currentLevelIndex + 1) + " | Score: " + score, p.width / 2, p.height / 2 + 20); // Show level
          p.textSize(20);
          p.text("Press Click to Restart Game", p.width / 2, p.height / 2 + 60);
          p.noStroke();
          return; // Stop drawing/updating
      }

      // Level Complete message (still useful between levels)
      if (isGameWon) { // No need for !isGameComplete check anymore
          p.fill(0, 150, 255, 200); // Blue overlay for level win
          p.rect(p.width / 2, p.height / 2, p.width, p.height);
          p.fill(255);
          p.stroke(0);
          p.strokeWeight(3);
          p.textSize(50);
          // Display completed generated level number
          p.text(`Level ${currentLevelIndex + 1} Complete!`, p.width / 2, p.height / 2 - 30);
          p.textSize(30);
          p.text("Score: " + score, p.width / 2, p.height / 2 + 30);
          p.textSize(20);
          p.text("Next level loading...", p.width / 2, p.height / 2 + 70);
          p.noStroke();
          // Don't return, allow game to draw underneath briefly before timeout loads next level
      }

      // Remove the "Game Complete" screen logic unless you add a max level
      /*
      if (isGameComplete) { 
          // ... (old win screen) ...
      }
      */

      // --- Draw UI Elements (Outside camera translation) --- 
      handleInput(); // Process input 
      updateFloatingScores(); // Update scores 
      drawScore(); // Draw score overlay 
      drawFloatingScores(); // Draw floating scores 
      drawComboDisplay(); // Draw combo text

  };

  // --- Hazard Functions ---
  const drawHazards = () => {
      p.push();
      p.noStroke();
      const spikeHeight = 15;
      const baseSpikeWidth = 10;

      for (let hazard of hazards) {
          if (hazard.type === 'spikes') {
              p.fill(150, 150, 150); // Grey color for spikes
              const totalWidth = hazard.width;
              const numSpikes = hazard.count || Math.floor(totalWidth / baseSpikeWidth) || 1;
              const actualSpikeWidth = totalWidth / numSpikes;
              const startX = hazard.x - totalWidth / 2; // Start drawing from left edge

              for (let i = 0; i < numSpikes; i++) {
                  const spikeBaseX = startX + i * actualSpikeWidth + actualSpikeWidth / 2;
                  // Draw upward pointing triangle
                  p.triangle(
                      spikeBaseX - actualSpikeWidth / 2, hazard.y, // Bottom-left
                      spikeBaseX + actualSpikeWidth / 2, hazard.y, // Bottom-right
                      spikeBaseX, hazard.y - spikeHeight     // Top point
                  );
              }
          } else if (hazard.type === 'lava') {
              p.fill(255, 100, 0, 220); // Orange-red for lava
              // Adjust coords because hazard x,y is center, but rect needs top-left
              const topLeftX = hazard.x - hazard.width / 2;
              const topLeftY = hazard.y - hazard.height / 2;
              p.rect(topLeftX, topLeftY, hazard.width, hazard.height); // Draw the lava pit
              // Optional: Add visual effect like bubbles?
              // Simple flicker effect:
              if (p.frameCount % 10 < 5) {
                  p.fill(255, 50, 0, 180);
                  p.rect(topLeftX, topLeftY, hazard.width, hazard.height);
              }
          } else if (hazard.type === 'single_spike') {
              p.fill(150, 150, 150); // Grey color for spikes
              const spikeWidth = hazard.width || 15;
              const sHeight = hazard.height || 10;
              // Draw upward pointing triangle at hazard x,y (assuming y is base)
               p.triangle(
                  hazard.x - spikeWidth / 2, hazard.y,         // Bottom-left
                  hazard.x + spikeWidth / 2, hazard.y,         // Bottom-right
                  hazard.x, hazard.y - sHeight                 // Top point
              );
          }
      }
      p.pop();
  };
  // --- End Hazard Functions ---

  // --- Platform Update Function ---
  const updatePlatforms = () => {
    if (!platforms) return;
    const now = p.millis(); // Get current time for timers

    for (let platform of platforms) {
        // Moving platform logic
        if (platform.isMoving && !platform.isVanished) { // Don't move if vanished
            if (platform.moveAxis === 'x') {
                platform.x += platform.moveSpeed * platform.moveDirection;
                if (platform.x >= platform.moveMax || platform.x <= platform.moveMin) {
                    platform.moveDirection *= -1;
                    platform.x = p.constrain(platform.x, platform.moveMin, platform.moveMax);
                }
            } else if (platform.moveAxis === 'y') {
                platform.y += platform.moveSpeed * platform.moveDirection;
                if (platform.y >= platform.moveMax || platform.y <= platform.moveMin) {
                    platform.moveDirection *= -1;
                    platform.y = p.constrain(platform.y, platform.moveMin, platform.moveMax);
                }
            }
        }

        // Crumbling platform logic
        if (platform.type === 'crumbling') {
            if (platform.isCrumbling && !platform.isVanished) {
                // Decrement timer (using frame count)
                if (platform.crumbleTimer > 0) {
                    platform.crumbleTimer--;
                    // Optional: Add shaking effect based on timer
                } else {
                    // Timer done, make platform vanish
                    platform.isVanished = true;
                    platform.isCrumbling = false; // Stop crumbling state
                    platform.respawnTimer = platform.respawnTime || 3000; // Set respawn timer (milliseconds)
                    platform.vanishTime = now; // Record vanish time
                    console.log("Platform vanished!");
                    // Play vanish sound?
                }
            }
            
            // Respawn logic (using millis for more accuracy)
            if (platform.isVanished && platform.respawnTimer > 0) {
                 if (now - platform.vanishTime >= platform.respawnTimer) {
                    platform.isVanished = false;
                    platform.isCrumbling = false; // Ensure it resets fully
                    platform.respawnTimer = 0; // Clear timer
                    console.log("Platform respawned!");
                    // Play respawn sound?
                }
            }
        }
    }
};
  // --- End Platform Update Function ---

  // --- Powerup Functions ---
  const POWERUP_DURATION = 300; // Frames (5 seconds)

  const applyPowerup = (powerupType) => {
      if (!player) return;
      removePowerup(); // Remove any existing powerup first

      player.activePowerup = powerupType;
      player.powerupTimer = POWERUP_DURATION;
      playSound(powerupCollectSound);
      console.log(`Powerup activated: ${powerupType}`);

      switch(powerupType) {
          case 'speedBoost':
              player.speed = player.baseSpeed * 1.6;
              break;
          case 'highJump':
              player.jumpForce = player.baseJumpForce * 1.3;
              // Might need to adjust double jump too?
              // doubleJumpForce = baseDoubleJumpForce * 1.2? 
              break;
          case 'invincibility':
              // Visual cue handled in drawPlayer maybe?
              break;
          case 'starMagnet': // Added star magnet type
              player.starMagnet = true;
              break;
          // Add more types here
      }
  };

  const removePowerup = () => {
      if (!player || !player.activePowerup) return;
      console.log(`Powerup expired: ${player.activePowerup}`);
      
      // Revert effects
      player.speed = player.baseSpeed;
      player.jumpForce = player.baseJumpForce;
      // Revert double jump if modified
      // doubleJumpForce = baseDoubleJumpForce;
      
      player.activePowerup = null;
      player.powerupTimer = 0;
      // Revert visual cue if any
  };

  const drawPowerups = () => {
      if (!powerups) return;
      p.push();
      p.rectMode(p.CENTER);
      p.strokeWeight(2);
      p.textSize(15);

      for (let pow of powerups) {
          if (!pow.isCollected) {
              p.stroke(0);
              let powColor = p.color(200);
              let symbol = '?';
              switch (pow.type) {
                  case 'speedBoost': 
                      powColor = p.color(0, 150, 255); // Blue
                      symbol = 'S';
                      break;
                  case 'highJump': 
                      powColor = p.color(0, 200, 100); // Green
                      symbol = 'J';
                      break;
                  case 'invincibility': 
                      powColor = p.color(255, 200, 0); // Yellow/Gold
                      symbol = '!';
                      break;
                  case 'starMagnet': // Added star magnet type
                      powColor = p.color(255, 105, 180); // Hot pink
                      symbol = 'M';
                      break;
              }
              p.fill(powColor);
              p.rect(pow.x, pow.y, 25, 25, 5); // Rounded rect
              p.fill(255);
              p.noStroke();
              p.textAlign(p.CENTER, p.CENTER);
              p.text(symbol, pow.x, pow.y - 1);
          }
      }
      p.pop(); // Restore defaults
  };

  // --- End Powerup Functions ---

  // --- Draw Goal Function ---
  const drawGoal = () => {
      if (levelGoal && !levelGoal.isReached) { // Only draw if it exists and hasn't been reached
          p.push();
          p.imageMode(p.CENTER);
          // Use preloaded goal image if available, otherwise draw fallback
          if (goalFlagImg) {
              // Adjust size as needed
              const goalWidth = 50;
              const goalHeight = 70;
              p.image(goalFlagImg, levelGoal.x, levelGoal.y, goalWidth, goalHeight);
          } else {
              // Fallback drawing (e.g., a yellow rectangle)
              p.fill(255, 215, 0); // Gold color
              p.noStroke();
              p.rect(levelGoal.x, levelGoal.y, 30, 50);
              p.fill(0);
              p.textSize(12);
              p.text("GOAL", levelGoal.x, levelGoal.y);
          }
          p.pop();
      }
  };
  // --- End Goal Function ---

  // --- Input Handling ---

  // Handles player input for movement. Jump is handled in keyPressed.
  // REMOVED DUPLICATE FUNCTION DEFINITION HERE

  // Handles jump actions on key press.
  p.keyPressed = () => {
      // Prevent input if game over or level won screen is showing
      if (isGameOver || isGameWon) {
          return;
      }

      if (p.keyCode === p.UP_ARROW || p.keyCode === 32) { // Up arrow or Spacebar
          // --- Jump Buffering: Set buffer instead of jumping directly ---
          jumpBufferCounter = JUMP_BUFFER_DURATION;

          // --- Actual Jump Logic (Uses Coyote Time & Buffer) ---
          if (player && (player.isOnGround || coyoteTimeCounter > 0)) {
               player.velocityY = player.jumpForce;
               player.isJumping = true;
               player.isOnGround = false;
               player.canDoubleJump = true; // Allow double jump after initial jump
               playSound(jumpSound);
               player.state = 'jump';
               player.standingOnPlatform = null; // Ensure not stuck to platform when jumping
               coyoteTimeCounter = 0; // Consume coyote time if used
               jumpBufferCounter = 0; // Consume buffer if used immediately
               // --- Jump Stretch ---
               player.visualHeight = player.baseHeight * 1.1;
               player.visualWidth = player.baseWidth * 0.9;
               // Jump particles
               emitParticles(player.x, player.y + player.height / 2, 12, p.color(220, 220, 255, 180), { speed: 2.5, life: 25, size: 5 });

          } else if (player && !player.isOnGround && player.canDoubleJump) { // Double Jump
               player.velocityY = doubleJumpForce; // Use double jump force
               player.canDoubleJump = false; // Consume double jump
               playSound(jumpSound); // Play sound again? Optional
               player.state = 'jump';
               // --- Double Jump Stretch ---
               player.visualHeight = player.baseHeight * 1.15;
          if (player && player.isOnGround) {
              player.velocityY = player.jumpForce;
              player.isJumping = true;
              player.isOnGround = false;
              player.canDoubleJump = true; // Allow double jump after initial jump
              playSound(jumpSound);
              player.state = 'jump';
              player.standingOnPlatform = null; // Ensure not stuck to platform when jumping
          } else if (player && !player.isOnGround && player.canDoubleJump) {
              player.velocityY = doubleJumpForce; // Use double jump force
              player.canDoubleJump = false; // Consume double jump
              playSound(jumpSound); // Play sound again? Optional
              player.state = 'jump';
               // Emit particles for double jump maybe?
              emitParticles(player.x, player.y, 10, p.color(200, 200, 255, 150), { speed: 2, life: 25 });
          }
      }

       // DEBUG / Cheats (Optional)
      if (p.key === 'g' || p.key === 'G') {
           isGodMode = !isGodMode;
           console.log(`God Mode ${isGodMode ? 'Enabled' : 'Disabled'}`);
      }
      if (p.key === 'n' || p.key === 'N') { // Skip level
          if (!isGameWon) { // Prevent skipping while already transitioning
              console.log("DEBUG: Skipping to next level");
              isGameWon = true; // Trigger the level transition logic
              if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
              setTimeout(() => {
                  currentLevelIndex++;
                  loadLevelData(currentLevelIndex);
              }, 500); // Faster transition for debug skip
          }
      }
       if (p.key === 'r' || p.key === 'R') { // Restart Game
           if (isGameOver) { // Only allow restart from game over screen for now
               console.log("Restarting game...");
               resetGame();
           }
       }

       // REMOVED Keyboard Volume Controls - now handled by wrapper
   };

  // --- Mouse Handling for Restart ---
  p.mousePressed = () => {
      if (isGameOver) {
          console.log("Restarting game (Mouse Click)... GITHUB COPILOT! ");
          resetGame();
      }
      // Prevent default browser action on right click, etc.
      // return false; // Optionally add if needed
  };

   // --- Prop Handling --- 
   p.updateWithProps = props => {
     if (props.volume !== undefined && props.volume !== internalMasterVolume) {
         if (typeof props.volume === 'number') {
             internalMasterVolume = p.constrain(props.volume, 0.0, 1.0);
             console.log(`Sketch received new volume prop: ${internalMasterVolume.toFixed(2)}`);
             // Apply the new volume to the background music if it's playing
             if (soundsLoaded && bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) {
                 bgMusic.setVolume(internalMasterVolume);
             }
             // Note: SFX volume is calculated relative to master volume when played
         }
     }
     // Handle other props if needed
   };

   // --- Sketch Cleanup ---
   p.remove = () => {
     console.log("p5 sketch removing...");
     if (soundsLoaded) {
       if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) {
         bgMusic.stop();
         console.log("Background music stopped during sketch removal.");
       }
       // Stop any other looping sounds here if needed
     }
     console.log("p5 sketch cleanup complete.");
   };

  
  }
 }

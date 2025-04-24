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

  // Combo System variables
  let stompComboCount = 0;
  let comboDisplayTimer = 0; // How long to show combo text
  const COMBO_DISPLAY_DURATION = 90; // Frames (1.5 seconds)

  // Screen Shake variables - REMOVED
  // let shakeDuration = 0;
  // let shakeIntensity = 0;

  // Volume control variables
  let internalMasterVolume = 1.0; // Renamed to avoid conflict with wrapper state
  const sfxVolumeMultiplier = 0.3; // Multiplier for sound effects (30%)

  // Level Dressing Assets
  let platformTexture;
  let decorationTree1;
  let decorations = []; // Array for decoration objects {img, x, y}

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
    if (soundsLoaded && sound && sound.isLoaded()) {
        try {
           // Determine volume
           let currentVolume = internalMasterVolume;
           if (sound !== bgMusic) { // Apply SFX multiplier only if it's not background music
               currentVolume *= sfxVolumeMultiplier;
           }
           sound.setVolume(currentVolume); // Set volume before playing

           // Audio context handling
           if (p.getAudioContext && p.getAudioContext().state !== 'running') {
                p.getAudioContext().resume().then(() => {
                    console.log(`playSound: Context resumed. State: ${p.getAudioContext().state}. Playing sound at volume ${currentVolume.toFixed(2)}`);
                    sound.play();
                }).catch(e => console.warn("playSound: Context resume failed:", e));
           } else if (p.getAudioContext) {
                console.log(`playSound: Playing sound (Context state: ${p.getAudioContext().state}) at volume ${currentVolume.toFixed(2)}`);
                sound.play();
           } else {
                console.log(`playSound: Playing sound (AudioContext unavailable) at volume ${currentVolume.toFixed(2)}`);
                sound.play();
           }
        } catch (e) {
            console.error("Error playing sound:", e);
        }
    } else if (!soundsLoaded) {
        // console.log("Attempted to play sound, but sounds not loaded."); // Optional
    } else if (sound && !sound.isLoaded()){
        console.warn("playSound: Attempted to play sound before it loaded individually.");
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
      const currentSize = p.map(part.life, 0, part.maxLife, 0, part.size); // Shrink
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

  // --- Screen Shake Function - REMOVED --- 
  /*
  const triggerShake = (intensity, duration) => {
      shakeIntensity = intensity;
      shakeDuration = duration;
      console.log(`Screen shake triggered: intensity=${intensity}, duration=${duration}`);
  };
  */

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
      if (player.x + player.width / 2 > p.width) {
          player.x = p.width - player.width / 2;
          player.velocityX = 0;
      }

      // Update animation state
      if (!player.isOnGround) {
          player.state = 'jump';
      } else if (player.velocityX === 0) {
          player.state = 'idle';
      }
       // Note: 'run' state is set in handleInput

      // Reset ground state before collision checks
      player.isOnGround = false;
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
         if (enemy.type === 'shooter') {
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
         if (!platform) continue; 
          if (rectRectCollision(player, platform)) {
              let prevPlayerBottom = (player.y - player.velocityY) + player.height / 2;
              let platformTop = platform.y - platform.height / 2;

              // Check if landing on top
              if (player.velocityY >= 0 && prevPlayerBottom <= platformTop + 5 && !player.isOnGround) { // Only trigger landing once
                  player.y = platformTop - player.height / 2; 
                  player.velocityY = 0; 
                  player.isJumping = false;
                  player.isOnGround = true;
                  player.canDoubleJump = false; 
                  landedThisFrame = true; // Set landing flag
                  player.standingOnPlatform = platform; // Link player to this platform
                  
                  // Landing Feedback
                  // playSound(landSound); // TEMPORARILY COMMENTED OUT
                  emitParticles(player.x, player.y + player.height / 2, 8, p.color(200, 200, 200, 100), { speed: 2, life: 20, size: 4 }); // Landing dust

                  // Reset combo count ONLY when landing
                  if (stompComboCount > 0) {
                       console.log(`Landed, resetting combo from ${stompComboCount}`);
                       // Don't reset timer here, let it fade
                  }
                  stompComboCount = 0; 
                  break; 
              }
          }
      }

      // Player vs Stars
      for (let i = stars.length - 1; i >= 0; i--) {
          let star = stars[i];
          if (!star) continue; 
          if (!star.isCollected && ellipseRectCollision(star, player)) {
              star.isCollected = true;
              score += 10;
              playSound(coinSound); 
              emitParticles(star.x, star.y, 25, p.color(255, 223, 0, 220), { speed: 3.5, life: 40, size: 10 }); // More star particles!
              emitFloatingScore("+10", star.x, star.y - 20); // Emit score pop-up
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
                  
                  player.velocityY = jumpForce * 0.7; // Bounce
                  player.isJumping = true;
                  player.isOnGround = false; // Important: Don't reset combo here!
                  player.canDoubleJump = true; 
                  player.state = 'jump';
                  
                  // Sound with pitch shift based on combo
                  const pitch = 1.0 + stompComboCount * 0.05;
                  if (defeatSound && defeatSound.isLoaded()) {
                      defeatSound.rate(pitch); // Increase pitch
                  }
                  playSound(defeatSound); 

                  // More particles/shake with combo?
                  const particleCount = 25 + stompComboCount * 5; // More particles based on combo
                  // const shakeIntensity = 2 + stompComboCount * 0.4; // REMOVED SHAKE reference
                  emitParticles(enemyX, enemyY, particleCount, p.color(150, 0, 0, 200), { speed: 4.5, life: 45, size: 8, gravity: 0.2 }); // Enemy defeat poof!
                  // triggerShake(shakeIntensity, 18); // REMOVED SHAKE
                  emitFloatingScore(`+${comboScore} (x${stompComboCount})`, enemyX, enemyY - 20); // Show combo score

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
                     if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                     console.log("Game Over - Player hit enemy");
                     isGameOver = true;
                     stompComboCount = 0; // Reset combo on game over
                     comboDisplayTimer = 0;
                     break; 
                  }
                  // isGameOver = true; // Moved inside the else if
                  // stompComboCount = 0; // Moved inside the else if
                  // comboDisplayTimer = 0; // Moved inside the else if
                  // break; 
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
                         if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
                         console.log("Game Over - Player hit hazard (lava)");
                      }
                      isGameOver = true;
                      stompComboCount = 0; 
                      comboDisplayTimer = 0;
                      emitParticles(player.x, player.y, 40, p.color(255, 100, 0, 200), { speed: 5, life: 50, size: 10, gravity: -0.1 }); // Lava splash particles?
                      break; 
                  }
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

  // Checks if all stars have been collected to trigger the win condition.
  const checkWinCondition = () => {
      if (!stars || stars.length === 0 || isGameWon || isGameOver) return; // Exit early if level already won/lost or no stars exist
      
      let allCollected = true;
      for (let star of stars) {
          if (!star || !star.isCollected) { // Check if star exists and is collected
              allCollected = false;
              break;
          }
      }
      
      if (allCollected) {
         isGameWon = true; // Mark current level as won
         playSound(victorySound);
         if (bgMusic && bgMusic.isLoaded() && bgMusic.isPlaying()) bgMusic.stop();
         console.log(`Generated Level ${currentLevelIndex + 1} Complete!`);
         
         // --- INFINITE PART ---
         // Immediately load next level after a short delay
         setTimeout(() => {
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
    // Fallback color if texture fails
    const fallbackColor = p.color(210, 180, 140, 200); // Semi-transparent Sand/Tan color

    // Guard clause with texture check
    if (!platforms) return;

    p.push(); // Isolate settings
    p.rectMode(p.CENTER); // Ensure rect is drawn from center like platform data

    if (!platformTexture || !platformTexture.width || !platformTexture.height) {
        // --- Fallback Drawing --- 
        console.warn("drawPlatformsWithTexture: platformTexture invalid, drawing fallback rects.");
        p.noStroke();
        p.fill(fallbackColor);
        for (let platform of platforms) {
            if (!platform) continue;
            p.rect(platform.x, platform.y, platform.width, platform.height);
        }
        // --- End Fallback --- 
    } else {
        // --- Original Texture Drawing --- 
        const tileWidth = 32; // ASSUMPTION: Tile size is 32x32 pixels
        const tileHeight = 32; // ASSUMPTION: Tile size is 32x32 pixels
        const sourceTileX = 0; // Use the top-left tile from the tileset for now
        const sourceTileY = 0;

        p.noStroke();
        p.imageMode(p.CORNER); // CORNER mode is best for tiling

        for (let platform of platforms) {
            if (!platform) continue;

            const topLeftX = platform.x - platform.width / 2;
            const topLeftY = platform.y - platform.height / 2;

            // Calculate how many tiles to draw
            const cols = Math.ceil(platform.width / tileWidth);
            const rows = Math.ceil(platform.height / tileHeight);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Calculate position to draw the current tile
                    const drawX = topLeftX + c * tileWidth;
                    const drawY = topLeftY + r * tileHeight;

                    // Calculate remaining width/height for the last tile in row/column
                    const currentTileWidth = (c === cols - 1) ? platform.width - c * tileWidth : tileWidth;
                    const currentTileHeight = (r === rows - 1) ? platform.height - r * tileHeight : tileHeight;

                    // Draw the tile portion from the source image
                    p.image(
                        platformTexture,
                        drawX,
                        drawY,
                        currentTileWidth, // Draw width (might be clipped)
                        currentTileHeight, // Draw height (might be clipped)
                        sourceTileX,
                        sourceTileY,
                        // Use the calculated width/height but ensure it doesn't exceed original tile size
                        Math.min(currentTileWidth, tileWidth),
                        Math.min(currentTileHeight, tileHeight)
                    );
                }
            }
        }
        p.imageMode(p.CENTER); // Reset imageMode
        // --- End Original Texture Drawing --- 
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
              p.fill(star.color);
              p.push();
              p.translate(star.x, star.y);
              p.rotate(p.frameCount * 0.02); // Gentle rotation
              // Draw a 5-pointed star
              p.beginShape();
              for (let i = 0; i < 5; i++) {
                  let angle = p.TWO_PI / 5 * i - p.HALF_PI; // Outer point angle
                  let xOuter = p.cos(angle) * star.size / 2;
                  let yOuter = p.sin(angle) * star.size / 2;
                  p.vertex(xOuter, yOuter);
                  angle += p.TWO_PI / 10; // Inner point angle
                  let xInner = p.cos(angle) * star.size / 4; // Inner radius
                  let yInner = p.sin(angle) * star.size / 4;
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
      console.log(`Generating level ${levelIndex + 1}`);
      const difficulty = levelIndex + 1; // Simple difficulty scale
      const level = {
          playerStart: { x: 100, y: p.height - 100 }, // Consistent start for now
          platforms: [],
          stars: [],
          enemies: [],
          hazards: [],
          powerups: []
      };

      // --- Base Ground Platform ---
      level.platforms.push({ x: p.width / 2, y: p.height - 20, width: p.width, height: 40 });
      let lastPlatform = level.platforms[0];
      let currentY = p.height - 80; // Start building platforms slightly above ground

      // --- Procedural Platform Generation ---
      const numPlatforms = p.constrain(5 + difficulty, 5, 20); // More platforms with difficulty
      const minPlatformWidth = 80;
      const maxPlatformWidth = 200 - difficulty * 5; // Smaller platforms at higher levels
      // Refined height calculation
      const maxJumpHeightForCheck = Math.abs(player ? player.baseJumpForce * 1.8 : jumpForce * 1.8); 
      const maxJumpWidth = (player ? player.baseSpeed : 5) * 40; 
      const minVerticalSeparation = 90; // <--- Slightly increased min again
      const maxVerticalSeparation = 140; // <--- Tighter max range, less extreme height diff
      const minHorizontalSeparation = 120; // <--- Increased horizontal separation

      for (let i = 0; i < numPlatforms; i++) {
          const newPlatform = {};
          const platWidth = p.random(minPlatformWidth, Math.max(minPlatformWidth, maxPlatformWidth));
          const platHeight = 20; // Standard platform height

          let placed = false;
          console.log(`--- Attempting to place Platform ${i+1} relative to Platform at (${lastPlatform.x.toFixed(0)}, ${lastPlatform.y.toFixed(0)}) ---`); // Log start
          for (let attempts = 0; attempts < 10; attempts++) { // Try a few positions
              const targetX = p.random(platWidth / 2, p.width - platWidth / 2);
              // Use refined vertical range calculation
              const targetY = p.constrain(
                  lastPlatform.y - p.random(minVerticalSeparation, maxVerticalSeparation), // Use min/max separation
                  100, // Don't go too high (absolute limit)
                  p.height - 60 // Don't go below ground level
              );

              const dy = lastPlatform.y - targetY; // Positive if new platform is higher
              const dxAbs = Math.abs(targetX - lastPlatform.x); // Absolute horizontal distance

              // Check if the platform is actually higher and meets separation criteria
              if (dy > minVerticalSeparation * 0.5 && dy < maxJumpHeightForCheck && dxAbs < maxJumpWidth && dxAbs > minHorizontalSeparation) { 
                  console.log(`  SUCCESS on Attempt ${attempts + 1}: Platform placed at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);
                  newPlatform.x = targetX;
                  newPlatform.y = targetY;
                  newPlatform.width = platWidth; // Assign width/height here
                  newPlatform.height = platHeight;

                   // Add chance for moving platforms based on difficulty
                  const movingChance = 0.05 + difficulty * 0.02;
                  if (p.random() < movingChance) {
                      newPlatform.isMoving = true;
                      newPlatform.moveAxis = (p.random() < 0.6) ? 'x' : 'y'; 
                      const moveRange = p.random(50, 100 + difficulty * 5);
                      newPlatform.moveSpeed = p.random(1, 2 + difficulty * 0.1);
                      newPlatform.moveMin = newPlatform[newPlatform.moveAxis] - moveRange / 2;
                      newPlatform.moveMax = newPlatform[newPlatform.moveAxis] + moveRange / 2;
                      newPlatform.initialMoveDirection = (p.random() < 0.5) ? 1 : -1;
                  }

                  level.platforms.push(newPlatform);
                  lastPlatform = newPlatform; // Update last platform placed
                  placed = true;
                  break; // Platform placed successfully
              } else {
                  // Log failure reason (optional)
                  // if (dy <= 0) console.log('    -> Fail: Too low or same level');
                  if (dy >= maxJumpHeightForCheck) console.log(`    -> Fail Attempt ${attempts+1}: Too high (dy=${dy.toFixed(1)} >= maxH=${maxJumpHeightForCheck.toFixed(1)})`);
                  if (dxAbs >= maxJumpWidth) console.log(`    -> Fail Attempt ${attempts+1}: Too far (dx=${dxAbs.toFixed(1)} >= maxW=${maxJumpWidth.toFixed(1)})`);
                  if (dxAbs <= minHorizontalSeparation) console.log(`    -> Fail Attempt ${attempts+1}: Too close horizontally (dx=${dxAbs.toFixed(1)} <= minSep=${minHorizontalSeparation})`); // Log if too close
              }
          }
          if (!placed) {
               console.warn(`Could not place platform ${i + 1} reachably/spaced after 10 attempts. Placing default offset platform.`);
               // --- Fallback Placement & Update lastPlatform --- 
               let fallbackX = lastPlatform.x + p.random(minHorizontalSeparation * 1.1, maxJumpWidth * 0.7) * (p.random() < 0.5 ? 1 : -1);
               fallbackX = p.constrain(fallbackX, platWidth / 2, p.width - platWidth / 2); 
               
               // Aim for a consistent mid-high range on fallback
               newPlatform.x = fallbackX;
               newPlatform.y = p.constrain(lastPlatform.y - (minVerticalSeparation + (maxVerticalSeparation - minVerticalSeparation) * 0.6), 100, p.height - 60); // Aim 60% up the allowed range 
               newPlatform.width = platWidth;
               newPlatform.height = platHeight; // Assign width/height

               // Fallback moving platform chance?
               const movingChance = 0.05 + difficulty * 0.02;
               if (p.random() < movingChance) {
                   newPlatform.isMoving = true;
                   newPlatform.moveAxis = (p.random() < 0.6) ? 'x' : 'y'; 
                   const moveRange = p.random(50, 100 + difficulty * 5);
                   newPlatform.moveSpeed = p.random(1, 2 + difficulty * 0.1);
                   newPlatform.moveMin = newPlatform[newPlatform.moveAxis] - moveRange / 2;
                   newPlatform.moveMax = newPlatform[newPlatform.moveAxis] + moveRange / 2;
                   newPlatform.initialMoveDirection = (p.random() < 0.5) ? 1 : -1;
               }

               level.platforms.push(newPlatform);
               lastPlatform = newPlatform; // CRITICAL: Update lastPlatform even on fallback
               // --- End Fallback --- 
          } 
          // No else needed, lastPlatform updated correctly on success
      }

      // --- Procedural Star Placement (One per platform, mostly) ---
      level.stars = []; // Start fresh
      const starSpawnChance = 0.8; // Chance to put a star on any given platform

      for (let i = 1; i < level.platforms.length; i++) { // Iterate through generated platforms
          if (p.random() < starSpawnChance) {
              const targetPlatform = level.platforms[i];
              level.stars.push({
                  x: targetPlatform.x + p.random(-targetPlatform.width * 0.3, targetPlatform.width * 0.3), // Random horizontal offset
                  y: targetPlatform.y - targetPlatform.height / 2 - 30, // Above platform
                  size: 25
              });
          }
      }
      // Ensure at least *some* stars exist if generation was unlucky
      if (level.stars.length < 2 && level.platforms.length > 2) { 
          const targetPlatform1 = level.platforms[1]; // Put one on first generated platform
          level.stars.push({ x: targetPlatform1.x, y: targetPlatform1.y - targetPlatform1.height / 2 - 30, size: 25 });
          if (level.platforms.length > 3) {
            const targetPlatformLast = level.platforms[level.platforms.length - 1]; // Put one on last platform
            level.stars.push({ x: targetPlatformLast.x, y: targetPlatformLast.y - targetPlatformLast.height/2 - 30, size: 25 });
          }
      }

      // --- Procedural Enemy Placement (Platform by Platform) --- 
      level.enemies = []; // Start with empty array
      const enemySpawnChanceBase = 0.5; // Base chance to spawn enemy on a platform
      const enemySpawnChanceDifficultyMultiplier = 0.05;
      const doubleEnemyChanceBase = 0.05; // Lower base chance for 2 enemies
      const doubleEnemyChanceDifficultyMultiplier = 0.04; // Lower scaling for 2 enemies

      for (let i = 1; i < level.platforms.length; i++) { // Start from index 1 to skip ground platform
          const targetPlatform = level.platforms[i];
          const spawnChance = p.constrain(enemySpawnChanceBase + difficulty * enemySpawnChanceDifficultyMultiplier, 0, 0.9);

          if (p.random() < spawnChance) {
              let enemyCount = 1;
              const doubleChance = p.constrain(doubleEnemyChanceBase + difficulty * doubleEnemyChanceDifficultyMultiplier, 0, 0.5);
              if (p.random() < doubleChance) {
                  enemyCount = 2;
              }

              console.log(`Spawning ${enemyCount} enemy/enemies on platform ${i}`);

              for (let j = 0; j < enemyCount; j++) {
                  const enemyWidth = 35; // Default size, adjust per type later
                  const enemyHeight = 35;
                  const patrolPadding = enemyWidth / 2 + 10; // Buffer from platform edge

                  // Ensure patrol range is valid
                  let patrolStart = targetPlatform.x - targetPlatform.width / 2 + patrolPadding;
                  let patrolEnd = targetPlatform.x + targetPlatform.width / 2 - patrolPadding;
                  
                  // If platform too small for patrol, center enemy or skip?
                  if (patrolEnd <= patrolStart) {
                      console.warn(`Platform ${i} too small for enemy patrol (width: ${targetPlatform.width}). Skipping enemy spawn.`);
                      continue; // Skip this enemy
                  }

                  // Place enemy within the patrol range
                  let enemyX = p.random(patrolStart + enemyWidth / 2, patrolEnd - enemyWidth / 2);
                  // Ensure enemyX is valid if range is small
                  enemyX = p.constrain(enemyX, patrolStart, patrolEnd); 

                  const enemy = {
                      x: enemyX,
                      y: targetPlatform.y - targetPlatform.height / 2 - enemyHeight / 2, // Place feet near platform top
                      width: enemyWidth, 
                      height: enemyHeight, 
                      velocityX: p.random(1, 2 + difficulty * 0.2) * (p.random() < 0.5 ? 1 : -1),
                      patrolStart: patrolStart,
                      patrolEnd: patrolEnd,
                  };

                  // Choose enemy type based on difficulty (similar to before)
                  const enemyTypeRoll = p.random();
                  if (difficulty > 4 && enemyTypeRoll < (0.1 + difficulty * 0.03)) {
                      enemy.type = 'charger';
                      enemy.img = enemyFoxImg; 
                      enemy.width = 35; enemy.height = 35;
                  } else if (difficulty > 2 && enemyTypeRoll < (0.3 + difficulty * 0.04)) {
                      enemy.type = 'shooter';
                      enemy.img = enemyBirdImg; 
                      enemy.width = 30; enemy.height = 30;
                      enemy.velocityX = 0; // Shooters stationary
                  } else if (enemyTypeRoll < 0.6) {
                      enemy.type = 'fox';
                      enemy.img = enemyFoxImg;
                      enemy.width = 35; enemy.height = 35;
                  } else {
                      enemy.type = 'rabbit';
                      enemy.img = enemyRabbitImg;
                      enemy.width = 30; enemy.height = 30;
                  }
                  console.log(`  -> Adding enemy of type ${enemy.type} to level.enemies (target platform index: ${i}, enemy j=${j})`); // <-- Added log
                  level.enemies.push(enemy); // Add the created enemy
              } // End inner loop (j)
          } // End if (spawnChance)
      } // End outer loop (i)

      // --- Procedural Hazard Placement ---
      const hazardChance = p.constrain(0.1 + difficulty * 0.05, 0.1, 0.5);
      if (p.random() < hazardChance && level.platforms.length > 2) {
          // Place spikes under a random platform (not ground, not first)
          const platformIndex = Math.floor(p.random(2, level.platforms.length));
          const targetPlatform = level.platforms[platformIndex];
          level.hazards.push({
              type: 'spikes',
              x: targetPlatform.x,
              y: targetPlatform.y + 20, // Below the platform
              width: p.random(targetPlatform.width * 0.5, targetPlatform.width),
              count: Math.floor(p.random(5, 10 + difficulty))
          });
      }
      // Add chance for lava pit on ground floor
      const lavaChance = p.constrain(0.05 + difficulty * 0.03, 0.05, 0.3);
       if (difficulty > 1 && p.random() < lavaChance) {
           level.hazards.push({
               type: 'lava',
               x: p.random(p.width * 0.2, p.width * 0.8), // Random position on ground
               y: p.height - 20, // Ground level
               width: p.random(80, 150 + difficulty * 10),
               height: 30
           });
       }

      // --- Procedural Powerup Placement ---
      const powerupChance = 0.2 + difficulty * 0.02; // Chance increases slightly
      if (p.random() < powerupChance && level.platforms.length > 1) {
          const platformIndex = Math.floor(p.random(1, level.platforms.length));
          const targetPlatform = level.platforms[platformIndex];
          const powerupTypes = ['speedBoost', 'highJump', 'invincibility'];
          const type = powerupTypes[Math.floor(p.random(powerupTypes.length))];
          level.powerups.push({
              type: type,
              x: targetPlatform.x,
              y: targetPlatform.y - 30 // Above platform
          });
      }

      console.log("Generated Level Structure:", JSON.stringify(level, null, 2)); // <-- ADDED LOG
      return level;
  };

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
          // Initialize moveDirection for moving platforms
          moveDirection: platformData.isMoving ? (platformData.initialMoveDirection || 1) : undefined 
      }));
      stars = level.stars.map(s => ({ ...s, isCollected: false, color: p.color(255, 223, 0) }));
      hazards = level.hazards ? level.hazards.map(h => ({ ...h })) : []; // Load hazards
      powerups = level.powerups ? level.powerups.map(pow => ({ ...pow, isCollected: false })) : []; // Load powerups
      
      // Initialize enemies, using the images assigned during generation
      enemies = [];
      if (level.enemies) { // Images should be assigned in generateLevel now
          enemies = level.enemies.map(e => {
               // Initialize cooldown for shooters
              let initialCooldown = (e.type === 'shooter') ? p.random(30, 120 - difficulty * 5) : undefined; // Cooldown potentially shorter at high levels
              return { ...e, velocityX: e.velocityX || 1, shootCooldown: initialCooldown }; // Ensure velocityX exists
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
       const baseSpeed = 5;
       const baseJumpForce = -12;
       player = {
          x: startPos ? startPos.x : p.width / 2,
          y: startPos ? startPos.y : p.height - 100,
          width: 45, // Adjusted size for Noot image
          height: 55, // Adjusted size for Noot image
          velocityX: 0,
          velocityY: 0,
          speed: baseSpeed,
          baseSpeed: baseSpeed, // Store base value
          jumpForce: baseJumpForce,
          baseJumpForce: baseJumpForce, // Store base value
          isJumping: false,
          isOnGround: false,
          canDoubleJump: false,
          color: p.color(50, 150, 255), // Keep color for fallback maybe?
          state: 'idle',
          standingOnPlatform: null, // Reference to the platform the player is currently standing on
          activePowerup: null, // { type: 'speedBoost', timer: 180 }
          powerupTimer: 0
      };
   }

  const initializeDecorations = () => {
    decorations = []; // Clear existing decorations
    if (decorationTree1) { // Ensure image is loaded
        // Add some example trees - adjust positions as needed
        decorations.push({ img: decorationTree1, x: 100, y: p.height - 60 }); // Near bottom left
        decorations.push({ img: decorationTree1, x: 700, y: p.height - 60 }); // Near bottom right
        // Add one potentially behind a platform
        decorations.push({ img: decorationTree1, x: 450, y: 380 }); 
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
          if (!img || !img.width || img.width <= 0) return;
          const imgWidth = img.width;
          // Calculate the offset based on camera and factor
          // Modulo ensures the offset wraps around, creating the loop
          let offsetX = (cameraX * factor) % imgWidth;

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
      jumpForce = -12;
      doubleJumpForce = -10; 
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
      drawBackground(); // Draw parallax background first
      drawDecorations(); // Draw decorations on top of background

      // --- Game Logic Updates --- 
      updatePlayer();
      updateEnemies();
      updatePlatforms(); // Update platform positions
      checkCollisions();
      checkWinCondition(); // Now handles infinite progression
      updateParticles(); 
      updateProjectiles(); // Add projectile updates

      // --- ADDED LOGS (before drawing) ---
      if (p.frameCount % 120 === 0) { // Log counts every 2 seconds to avoid spam
          console.log(`Draw loop counts (Lvl ${currentLevelIndex+1}): Plat=${platforms?.length}, Star=${stars?.length}, Enemy=${enemies?.length}`);
      }
      // --- END ADDED LOGS ---

      // --- Drawing Game Elements --- 
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

      // --- Draw UI Elements --- 
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
          }
      }
      p.pop();
  };
  // --- End Hazard Functions ---

  // --- Platform Update Function ---
  const updatePlatforms = () => {
      if (!platforms) return;
      for (let platform of platforms) {
          if (platform.isMoving) {
              if (platform.moveAxis === 'x') {
                  platform.x += platform.moveSpeed * platform.moveDirection;
                  if (platform.x >= platform.moveMax || platform.x <= platform.moveMin) {
                      platform.moveDirection *= -1; // Reverse direction
                      // Optional: Clamp position to prevent overshooting slightly
                      platform.x = p.constrain(platform.x, platform.moveMin, platform.moveMax);
                  }
              } else if (platform.moveAxis === 'y') {
                  platform.y += platform.moveSpeed * platform.moveDirection;
                   if (platform.y >= platform.moveMax || platform.y <= platform.moveMin) {
                      platform.moveDirection *= -1; // Reverse direction
                      // Optional: Clamp position
                      platform.y = p.constrain(platform.y, platform.moveMin, platform.moveMax);
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

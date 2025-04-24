// Complete rewrite of mario-generator.js with guaranteed platforms and stars

const generateLevel = (levelIndex, p, player, jumpForce, assets) => {
    console.log(`Generating COMPLETELY REWRITTEN brainrot level ${levelIndex + 1}`);
    const difficulty = levelIndex + 1;
    
    // --- Physics constants & Scaled Parameters ---
    const gravity = 0.6;
    // Increase min gap more noticeably with difficulty
    const minHorizontalGap = 70 + difficulty * 6; 
    // Increase max gap potential as well
    const maxHorizontalGapVariance = 120 + difficulty * 15;
    // Decrease max platform width
    const maxPlatformWidth = Math.max(70, 160 - difficulty * 10); // Gets smaller faster, min 70
    const minPlatformWidth = Math.max(50, 80 - difficulty * 4); // Slightly decrease min width too, min 50
    // Increase chance for special platforms
    const specialPlatformChance = Math.min(0.75, 0.40 + difficulty * 0.04); // Caps at 75% chance
    // Increase enemy spawn chance
    const enemySpawnChance = Math.min(0.80, 0.35 + difficulty * 0.06); // Caps at 80% chance
    // Increase hazard spawn chance (spikes/lava)
    const hazardBaseChance = 0.15 + difficulty * 0.02; // Base chance for attempting hazard spawn
    const spikeChance = Math.min(0.40, 0.18 + difficulty * 0.03); // Chance for *spikes* if hazard roll passes, caps at 40%
    const lavaChance = Math.min(0.30, 0.10 + difficulty * 0.025); // Chance for *lava* if hazard roll passes, caps at 30%
    
    // Initialize level data structure
    const level = {
        playerStart: { x: 100, y: p.height - 100 },
        platforms: [],
        stars: [],
        enemies: [],
        hazards: [],
        powerups: []
    };
    
    // --- Ground Platform ---
    // Extend the ground significantly to act as a safety net
    const groundWidth = p.width * 3; // Make it much wider than the screen initially
    const groundPlatform = { 
        x: groundWidth / 2 - p.width, // Start it further left so it covers the initial area well
        y: p.height - 20, 
        width: groundWidth, 
        height: 40,
        isGround: true // Add a flag for potential future logic
    };
    level.platforms.push(groundPlatform);
    
    // --- GUARANTEED STARTER PATTERN - First 3 Platforms ---
    console.log("CREATING MANDATORY STARTER PLATFORMS");
    
    // First platform - directly in front of player
    const platform1 = {
        x: 250,  // Directly in view, right of player
        y: p.height - 150, // Higher than ground
        width: 120,
        height: 20
    };
    level.platforms.push(platform1);
    
    // Second platform - slightly higher and to the right
    const platform2 = {
        x: 420,
        y: p.height - 190,
        width: 110,
        height: 20,
        type: difficulty > 1 ? 'bouncy' : undefined,
        bounceFactor: 1.4
    };
    
    if (platform2.type === 'bouncy') {
        platform2.height = 15; // Thinner bouncy platform
    }
    
    level.platforms.push(platform2);
    
    // Third platform - another jump to the right
    const platform3 = {
        x: 580,
        y: p.height - 160,
        width: 130,
        height: 20
    };
    level.platforms.push(platform3);
    
    // --- GUARANTEED STARS ---
    // Star on first platform
    level.stars.push({
        x: platform1.x,
        y: platform1.y - 40,
        size: 25
    });
    
    // Star group on third platform
    level.stars.push({
        x: platform3.x - 20,
        y: platform3.y - 40,
        size: 25
    });
    level.stars.push({
        x: platform3.x + 20,
        y: platform3.y - 40,
        size: 25
    });
    
    // --- GUARANTEED ENEMY ---
    const enemy = {
        x: platform2.x,
        y: platform2.y - 20,
        width: 35,
        height: 35,
        velocityX: 1,
        patrolStart: platform2.x - platform2.width / 2 + 20,
        patrolEnd: platform2.x + platform2.width / 2 - 20,
        type: 'rabbit',
        img: 'enemyRabbitImg'
    };
    level.enemies.push(enemy);
    
    // --- NOW GENERATE ADDITIONAL RANDOM PLATFORMS ---
    console.log("ADDING ADDITIONAL RANDOM PLATFORMS");
    
    let lastPlatform = platform3;  // Start from the last guaranteed one
    let currentX = lastPlatform.x + lastPlatform.width / 2;
    const endX = p.width - 80;
    let platformsGenerated = 3; // We already added 3
    
    // Generate more platforms until reaching the end of screen
    while (currentX < endX) {
        console.log(`Generating additional platform ${platformsGenerated + 1}`);
        
        // 1. Calculate next position (potentially much higher & further right)
        const horizontalDist = p.random(minHorizontalGap, minHorizontalGap + maxHorizontalGapVariance); 
        const verticalDist = p.random(-140, 70); // Allow slightly larger downward steps too
        
        const nextX = lastPlatform.x + lastPlatform.width / 2 + horizontalDist;
        // ADJUSTED Y CONSTRAINTS: Allow platforms higher up, but prevent going too low
        const nextY = p.constrain(lastPlatform.y + verticalDist, 
                                 p.height * 0.3,  // Allow platforms up to 30% from the top
                                 p.height - 200); // Prevent platforms being too close to initial ground/starter platforms
        
        // 2. Create platform 
        const platformWidth = p.random(minPlatformWidth, maxPlatformWidth); 
        const newPlatform = {
            x: nextX,
            y: nextY,
            width: platformWidth,
            height: 20
        };
        
        // Add variety if not the first few platforms
        // Use scaled chance for special platforms
        if (platformsGenerated >= 3 && p.random() < specialPlatformChance) { 
            const typeRoll = p.random();
            
            // Scale probabilities based on difficulty for *which* special type
            const movingXProb = 0.35 + difficulty * 0.01; // Slightly increases
            const movingYProb = movingXProb + 0.25 + difficulty * 0.01; // Becomes more likely than X later
            const bouncyProb = movingYProb + 0.25 + difficulty * 0.01;
            const crumblingProb = bouncyProb + 0.15 + difficulty * 0.02; // Becomes more likely
            
            // Adjusted type selection based on scaled probabilities
            if (typeRoll < movingXProb) { // Moving X
                newPlatform.type = 'moving';
                newPlatform.isMoving = true;
                newPlatform.moveAxis = 'x';
                newPlatform.moveSpeed = 1 + p.random(0.5 + difficulty * 0.15); // Slightly faster with difficulty
                newPlatform.moveMin = nextX - p.random(50, 80);
                newPlatform.moveMax = nextX + p.random(50, 80);
                newPlatform.moveDirection = p.random() < 0.5 ? 1 : -1;
            } else if (typeRoll < movingYProb) { // Moving Y
                newPlatform.type = 'moving';
                newPlatform.isMoving = true;
                newPlatform.moveAxis = 'y';
                newPlatform.moveSpeed = 0.8 + p.random(0.4 + difficulty * 0.15); // Slightly faster with difficulty
                newPlatform.moveMin = nextY - p.random(40, 70);
                newPlatform.moveMax = nextY + p.random(40, 70);
                newPlatform.moveDirection = p.random() < 0.5 ? 1 : -1;
            } else if (typeRoll < bouncyProb) { // Bouncy
                newPlatform.type = 'bouncy';
                newPlatform.bounceFactor = 1.4 + p.random(0.3);
                newPlatform.height = 15;
            } else if (difficulty >= 2 && typeRoll < crumblingProb) { // Crumbling (Needs difficulty >= 2 still)
                newPlatform.type = 'crumbling';
                newPlatform.crumbleTime = Math.max(300, 700 - difficulty * 30); // Crumbles faster
                newPlatform.respawnTime = 3000 + p.random(1500);
            }
        }
        
        level.platforms.push(newPlatform);
        console.log(`Created platform at (${newPlatform.x.toFixed(0)}, ${newPlatform.y.toFixed(0)}), W=${newPlatform.width.toFixed(0)}`);
        
        // 3. Add collectibles/enemies on some platforms
        let enemyAddedToPlatform = false; // Flag to track if enemy was added
        
        // Increase enemy chance slightly, especially on harder levels
        // Use scaled enemy spawn chance
        const enemyRoll = p.random();
        if (!newPlatform.isMoving && enemyRoll < enemySpawnChance) { 
            let enemyType = 'rabbit'; // Default
            const specificEnemyRoll = p.random();
            // Scale probabilities for tougher enemies
            const chargerProb = Math.min(0.4, 0.1 + difficulty * 0.03); // Caps at 40%
            const shooterProb = chargerProb + Math.min(0.4, 0.2 + difficulty * 0.04); // Caps at 40% relative to charger
            const foxProb = shooterProb + Math.min(0.5, 0.3 + difficulty * 0.02); // Fox becomes less likely relative to others
            
            if (difficulty >= 3 && specificEnemyRoll < chargerProb) { // Chargers from level 3+
                enemyType = 'charger'; 
            } else if (difficulty >= 2 && specificEnemyRoll < shooterProb) { // Shooters from level 2+
                enemyType = 'shooter_fox'; 
            } else if (specificEnemyRoll < foxProb) { // Fox is now less dominant than rabbit at high diff
                enemyType = 'fox';
            } // Else defaults to rabbit
            
            const enemyImgIdentifier = (enemyType === 'shooter_fox' || enemyType === 'fox' || enemyType === 'charger') ? 'enemyFoxImg' : 'enemyRabbitImg'; // Assume charger uses fox img for now?
            const enemyWidth = (enemyType === 'shooter_fox' || enemyType === 'charger') ? 40 : 35; // Make charger bigger too
            const enemyHeight = (enemyType === 'shooter_fox' || enemyType === 'charger') ? 40 : 35;
            
            level.enemies.push({
                x: newPlatform.x,
                y: newPlatform.y - 20,
                width: enemyWidth,
                height: enemyHeight,
                // Slightly faster patrol speed
                velocityX: (1 + difficulty * 0.05) * (p.random() < 0.5 ? 1 : -1), 
                patrolStart: newPlatform.x - newPlatform.width/2 + 25,
                patrolEnd: newPlatform.x + newPlatform.width/2 - 25,
                type: enemyType, 
                img: enemyImgIdentifier // Use the string identifier
            });
            enemyAddedToPlatform = true; // Set flag if enemy added

            // --- ADD STAR NEAR ENEMY --- 
            level.stars.push({
                x: newPlatform.x + p.random(-30, 30), // Place star near the center (enemy spawn)
                y: newPlatform.y - 45, // Slightly above enemy
                size: 25
            });
            console.log(`Added star near enemy on platform at (${newPlatform.x.toFixed(0)}, ${newPlatform.y.toFixed(0)})`);
            // --- END ADD STAR NEAR ENEMY --- 
        }
        
        // Add Hazards (Spikes) sometimes, not on moving/bouncy/crumbling platforms
        // Only add hazards if an enemy WASN'T already added (to avoid overcrowding/unfairness?)
        // Use scaled hazard chance
        if (!enemyAddedToPlatform && difficulty >= 2 && !newPlatform.type && p.random() < hazardBaseChance) { 
            const hazardTypeRoll = p.random();
            if (hazardTypeRoll < spikeChance) { // Check against scaled spike chance
                 level.hazards.push({
                    type: 'spikes', 
                    x: newPlatform.x,
                    y: newPlatform.y - newPlatform.height / 2, // Place spikes on top of the platform
                    width: newPlatform.width * p.random(0.5, 0.8), // Cover 50-80% of the platform width
                    count: Math.max(3, Math.floor(newPlatform.width / 15)) // Estimate number of spikes
                });
                console.log(`Added spikes hazard to platform at (${newPlatform.x.toFixed(0)}, ${newPlatform.y.toFixed(0)})`);
            }
        }
        
        // Add Lava Hazard below some gaps (if the gap is significant)
        const verticalGap = nextY - (lastPlatform.y + lastPlatform.height / 2); // Approx vertical distance from bottom of last platform
        const horizontalGap = nextX - (lastPlatform.x + lastPlatform.width / 2);
        // Add lava if it's a decent jump down or a long horizontal jump, and random chance passes
        // Use scaled lava chance
        if (difficulty >= 3 && (verticalGap > 80 || horizontalGap > 150) && p.random() < lavaChance) { 
            const lavaWidth = p.random(80, 150);
            const lavaX = lastPlatform.x + lastPlatform.width / 2 + horizontalDist / 2; // Place roughly in the middle of the gap
            const lavaY = p.height - 30; // Place near the bottom (above the extended ground)
            level.hazards.push({
                type: 'lava',
                x: lavaX,
                y: lavaY,
                width: lavaWidth,
                height: 40 // Relatively shallow but wide
            });
            console.log(`Added lava hazard at (${lavaX.toFixed(0)}, ${lavaY.toFixed(0)})`);
        }
        
        // 4. Update loop variables
        lastPlatform = newPlatform;
        currentX = nextX + platformWidth/2;
        platformsGenerated++;
        
        // Safety break - Increase slightly to allow for potentially more spaced out levels
        // Maybe increase max platforms based on difficulty? 
        const maxPlatforms = 15 + Math.floor(difficulty / 2);
        if (platformsGenerated > maxPlatforms) break;
    }
    
    // --- Final Platform (goal) ---
    // Adjust Y position to be consistent with new height range
    const finalX = Math.min(endX - 30, lastPlatform.x + p.random(180, 280)); // More random final distance
    const finalY = p.random(p.height * 0.35, p.height - 250); // Place final platform within the new height range
    const finalPlatform = {
        x: finalX,
        y: finalY,
        width: 150,
        height: 20
    };
    level.platforms.push(finalPlatform);
    
    // Add powerup to final platform
    const powerupTypes = ['speedBoost', 'highJump', 'invincibility'];
    const powerupType = powerupTypes[Math.floor(p.random(powerupTypes.length))];
    level.powerups.push({
        type: powerupType,
        x: finalPlatform.x,
        y: finalPlatform.y - 30
    });
    
    // Final verification of minimum requirements
    console.log(`Generated level contains: ${level.platforms.length - 1} platforms, ${level.stars.length} stars, ${level.enemies.length} enemies`);
    
    return level;
};

// Export the generator function
module.exports = { generateLevel };

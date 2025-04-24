// Complete rewrite of mario-generator.js with guaranteed platforms and stars
// NOW using chunk-based generation for more structure

// --- Chunk Definition Helper ---
// Base class or structure for chunks (optional, but can help organize)
class LevelChunk {
    constructor(startX, startY, difficulty, p) {
        this.startX = startX;
        this.startY = startY;
        this.difficulty = difficulty;
        this.p = p;
        this.platforms = [];
        this.stars = [];
        this.enemies = [];
        this.hazards = [];
        this.powerups = [];
        // Define exit point relative to startX/startY after generation
        this.exitX = startX; 
        this.exitY = startY; 
        this.lastPlatform = null; // Track the last platform within the chunk
    }
    
    // Method to get all generated elements
    getElements() {
        return {
            platforms: this.platforms,
            stars: this.stars,
            enemies: this.enemies,
            hazards: this.hazards,
            powerups: this.powerups,
            exitX: this.exitX,
            exitY: this.exitY,
            lastPlatform: this.lastPlatform
        };
    }
}

// --- Define Specific Chunk Generation Functions ---

// Chunk 1: Simple Jump Gap
const createSimpleJumpChunk = (startX, startY, difficulty, p, minWidth, maxWidth) => {
    const chunk = new LevelChunk(startX, startY, difficulty, p);
    const platWidth = p.random(minWidth, maxWidth);
    const hGap = p.random(80 + difficulty * 4, 150 + difficulty * 8); // Gap before the platform
    const vGap = p.random(-60, 40); // Vertical change

    const platX = startX + hGap;
    const platY = p.constrain(startY + vGap, p.height * 0.3, p.height - 150);
    
    const platform = { x: platX, y: platY, width: platWidth, height: 20 };
    chunk.platforms.push(platform);
    
    // Add a star above maybe?
    if (p.random() < 0.4) {
        chunk.stars.push({ x: platX, y: platY - 40, size: 25 });
    }

    chunk.exitX = platX + platWidth / 2;
    chunk.exitY = platY;
    chunk.lastPlatform = platform;
    console.log(` Chunk: SimpleJump | Exit: (${chunk.exitX.toFixed(0)}, ${chunk.exitY.toFixed(0)})`);
    return chunk.getElements();
};

// Chunk 2: Platform with Patrol Enemy
const createEnemyPatrolChunk = (startX, startY, difficulty, p, minWidth, maxWidth, assets) => {
    const chunk = new LevelChunk(startX, startY, difficulty, p);
    const platWidth = p.random(minWidth + 20, maxWidth + 30); // Slightly wider for enemy
    const hGap = p.random(70 + difficulty * 3, 130 + difficulty * 6);
    const vGap = p.random(-50, 50);
    
    const platX = startX + hGap;
    const platY = p.constrain(startY + vGap, p.height * 0.3, p.height - 150);
    
    const platform = { x: platX, y: platY, width: platWidth, height: 20 };
    chunk.platforms.push(platform);

    // Add enemy
    const enemyType = (difficulty >= 2 && p.random() < 0.3) ? 'shooter_fox' : 'rabbit';
    const enemyImgIdentifier = (enemyType === 'shooter_fox') ? 'enemyFoxImg' : 'enemyRabbitImg';
    const enemyWidth = (enemyType === 'shooter_fox') ? 40 : 35;
    const enemyHeight = (enemyType === 'shooter_fox') ? 40 : 35;
    
    chunk.enemies.push({
        x: platX,
        y: platY - 20,
        width: enemyWidth,
        height: enemyHeight,
        velocityX: (1 + difficulty * 0.05) * (p.random() < 0.5 ? 1 : -1), 
        patrolStart: platX - platWidth/2 + 25,
        patrolEnd: platX + platWidth/2 - 25,
        type: enemyType, 
        img: enemyImgIdentifier // Use the string identifier from assets
    });
    
    // Add stars near enemy
    chunk.stars.push({ x: platX + p.random(-20, 20), y: platY - 45, size: 25 });

    chunk.exitX = platX + platWidth / 2;
    chunk.exitY = platY;
    chunk.lastPlatform = platform;
    console.log(` Chunk: EnemyPatrol | Exit: (${chunk.exitX.toFixed(0)}, ${chunk.exitY.toFixed(0)})`);
    return chunk.getElements();
};

// Chunk 3: Bouncy Ascent
const createBouncyAscentChunk = (startX, startY, difficulty, p, minWidth, maxWidth) => {
    const chunk = new LevelChunk(startX, startY, difficulty, p);
    let currentChunkX = startX;
    let currentChunkY = startY;
    let lastChunkPlat = null; // Need a local last platform

    // Platform 1 (Bouncy)
    const plat1Width = p.random(minWidth - 10, maxWidth - 20);
    const hGap1 = p.random(60 + difficulty * 2, 110 + difficulty * 4);
    const vGap1 = p.random(-90, -50); // Force upwards
    const plat1X = currentChunkX + hGap1;
    const plat1Y = p.constrain(currentChunkY + vGap1, p.height * 0.3, p.height - 150);
    const platform1 = { 
        x: plat1X, y: plat1Y, width: plat1Width, height: 15,
        type: 'bouncy', bounceFactor: 1.4 + p.random(0.3)
    };
    chunk.platforms.push(platform1);
    currentChunkX = plat1X + plat1Width / 2;
    currentChunkY = plat1Y;
    lastChunkPlat = platform1;

    // Platform 2 (Higher)
    const plat2Width = p.random(minWidth, maxWidth);
    const hGap2 = p.random(50 + difficulty * 2, 100 + difficulty * 4); // Shorter horizontal for bounce
    const vGap2 = p.random(-120, -70); // Higher still
    const plat2X = plat1X + hGap2; // Relative to bouncy platform's center
    const plat2Y = p.constrain(plat1Y + vGap2, p.height * 0.25, p.height - 200); // Allow higher placement
    const platform2 = { x: plat2X, y: plat2Y, width: plat2Width, height: 20 };
    chunk.platforms.push(platform2);
    
    // Star on the higher platform
    chunk.stars.push({ x: plat2X, y: plat2Y - 40, size: 25 });

    chunk.exitX = plat2X + plat2Width / 2;
    chunk.exitY = plat2Y;
    chunk.lastPlatform = platform2;
    console.log(` Chunk: BouncyAscent | Exit: (${chunk.exitX.toFixed(0)}, ${chunk.exitY.toFixed(0)})`);
    return chunk.getElements();
};

// Chunk 4: Crumbling Bridge (Difficulty 2+)
const createCrumblingBridgeChunk = (startX, startY, difficulty, p, minWidth, maxWidth) => {
    const chunk = new LevelChunk(startX, startY, difficulty, p);
    let currentChunkX = startX;
    let currentChunkY = startY;
    let lastChunkPlat = null;
    const numSegments = p.int(p.random(3, 5)); // 3 to 5 crumbling segments
    const segmentWidth = p.random(minWidth - 20, maxWidth - 30);
    const segmentGap = 15; // Small gap between segments
    const hGapStart = p.random(90 + difficulty * 4, 160 + difficulty * 8); // Gap before the bridge
    const vGap = p.random(-30, 30); // Keep bridge relatively level with start

    currentChunkX += hGapStart;
    currentChunkY = p.constrain(startY + vGap, p.height * 0.35, p.height - 180);

    for (let i = 0; i < numSegments; i++) {
        const platX = currentChunkX + (segmentWidth + segmentGap) * i;
        const platform = {
            x: platX, y: currentChunkY, width: segmentWidth, height: 20,
            type: 'crumbling', 
            crumbleTime: Math.max(250, 600 - difficulty * 40), // Crumbles faster
            respawnTime: 3500 + p.random(1000)
        };
        chunk.platforms.push(platform);
        lastChunkPlat = platform; // Keep track of the last one
        
        // Maybe add a star on one of the segments
        if (i === p.int(numSegments / 2) && p.random() < 0.6) {
            chunk.stars.push({ x: platX, y: currentChunkY - 40, size: 25 });
        }
    }

    chunk.exitX = lastChunkPlat.x + segmentWidth / 2;
    chunk.exitY = lastChunkPlat.y;
    chunk.lastPlatform = lastChunkPlat;
    console.log(` Chunk: CrumblingBridge | Exit: (${chunk.exitX.toFixed(0)}, ${chunk.exitY.toFixed(0)})`);
    return chunk.getElements();
};

// Chunk 5: Hazard Jump (Spikes - Difficulty 2+)
const createSpikeJumpChunk = (startX, startY, difficulty, p, minWidth, maxWidth) => {
    const chunk = new LevelChunk(startX, startY, difficulty, p);
    
    // Platform 1 (Before hazard)
    const plat1Width = p.random(minWidth, maxWidth);
    const hGap1 = p.random(70 + difficulty * 3, 120 + difficulty * 5);
    const vGap1 = p.random(-40, 40);
    const plat1X = startX + hGap1;
    const plat1Y = p.constrain(startY + vGap1, p.height * 0.3, p.height - 150);
    const platform1 = { x: plat1X, y: plat1Y, width: plat1Width, height: 20 };
    chunk.platforms.push(platform1);

    // Hazard (Spikes below the gap)
    const hazardGap = p.random(120 + difficulty * 6, 180 + difficulty * 10); // The jump distance over spikes
    const spikeWidth = hazardGap * p.random(0.6, 0.9);
    const spikeX = plat1X + plat1Width / 2 + hazardGap / 2; // Center of the gap
    const spikeY = p.constrain(plat1Y + p.random(50, 90), plat1Y + 40, p.height - 80); // Below the jump arc
    chunk.hazards.push({
        type: 'spikes',
        x: spikeX,
        y: spikeY,
        width: spikeWidth,
        count: Math.max(3, Math.floor(spikeWidth / 15))
    });

    // Platform 2 (After hazard)
    const plat2Width = p.random(minWidth, maxWidth);
    const plat2X = plat1X + plat1Width / 2 + hazardGap; // Position after the hazard gap
    const plat2Y = p.constrain(plat1Y + p.random(-30, 30), p.height * 0.3, p.height - 150); // Roughly same level
    const platform2 = { x: plat2X, y: plat2Y, width: plat2Width, height: 20 };
    chunk.platforms.push(platform2);
    
    // Optional star after the hazard
    if (p.random() < 0.5) {
        chunk.stars.push({ x: plat2X, y: plat2Y - 40, size: 25 });
    }

    chunk.exitX = plat2X + plat2Width / 2;
    chunk.exitY = plat2Y;
    chunk.lastPlatform = platform2;
    console.log(` Chunk: SpikeJump | Exit: (${chunk.exitX.toFixed(0)}, ${chunk.exitY.toFixed(0)})`);
    return chunk.getElements();
};


// --- Main Level Generation Function ---
const generateLevel = (levelIndex, p, player, jumpForce, assets) => {
    console.log(`Generating CHUNK-BASED brainrot level ${levelIndex + 1}`);
    const difficulty = levelIndex + 1;
    
    // --- Difficulty Scaled Parameters (ADJUSTED FOR CHUNKS) ---
    const maxPlatformWidth = Math.max(70, 160 - difficulty * 8); // Gets smaller a bit slower
    const minPlatformWidth = Math.max(50, 80 - difficulty * 3); 
    // More complex params might be handled within chunk logic now
    
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
    const groundWidth = p.width * 3; 
    const groundPlatform = { 
        x: groundWidth / 2 - p.width, 
        y: p.height - 20, 
        width: groundWidth, 
        height: 40,
        isGround: true 
    };
    level.platforms.push(groundPlatform);
    
    // --- GUARANTEED STARTER PATTERN - First 3 Platforms ---
    console.log("CREATING MANDATORY STARTER PLATFORMS");
    const platform1 = { x: 250, y: p.height - 150, width: 120, height: 20 };
    level.platforms.push(platform1);
    const platform2 = { 
        x: 420, y: p.height - 190, width: 110, height: 20,
        type: difficulty > 1 ? 'bouncy' : undefined, 
        bounceFactor: 1.4,
        height: (difficulty > 1 ? 15 : 20) // Adjust height if bouncy
    };
    level.platforms.push(platform2);
    const platform3 = { x: 580, y: p.height - 160, width: 130, height: 20 };
    level.platforms.push(platform3);
    
    // Guaranteed Stars and Enemy (same as before)
    level.stars.push({ x: platform1.x, y: platform1.y - 40, size: 25 });
    level.stars.push({ x: platform3.x - 20, y: platform3.y - 40, size: 25 });
    level.stars.push({ x: platform3.x + 20, y: platform3.y - 40, size: 25 });
    level.enemies.push({
        x: platform2.x, y: platform2.y - 20, width: 35, height: 35, velocityX: 1,
        patrolStart: platform2.x - platform2.width / 2 + 20,
        patrolEnd: platform2.x + platform2.width / 2 - 20,
        type: 'rabbit', img: 'enemyRabbitImg' // Use asset key
    });
    
    // --- NOW GENERATE LEVEL USING CHUNKS ---
    console.log("ADDING CHUNKS RANDOMLY");
    
    let lastPlatform = platform3; // Start from the last guaranteed one
    let currentX = lastPlatform.x + lastPlatform.width / 2; // Exit X of starter
    let currentY = lastPlatform.y; // Exit Y of starter
    const endX = p.width * (1.5 + difficulty * 0.5); // Make level longer with difficulty
    let platformsGenerated = 3; // From starter
    let chunksGenerated = 0;
    const maxChunks = 6 + Math.floor(difficulty / 1.5); // Limit chunk count based on difficulty

    // Define available chunk functions
    const availableChunks = [
        (startX, startY, diff, p5) => createSimpleJumpChunk(startX, startY, diff, p5, minPlatformWidth, maxPlatformWidth),
        (startX, startY, diff, p5) => createEnemyPatrolChunk(startX, startY, diff, p5, minPlatformWidth, maxPlatformWidth, assets),
        (startX, startY, diff, p5) => createBouncyAscentChunk(startX, startY, diff, p5, minPlatformWidth, maxPlatformWidth),
    ];
    // Add difficulty-gated chunks
    if (difficulty >= 2) {
        availableChunks.push((startX, startY, diff, p5) => createCrumblingBridgeChunk(startX, startY, diff, p5, minPlatformWidth, maxPlatformWidth));
        availableChunks.push((startX, startY, diff, p5) => createSpikeJumpChunk(startX, startY, diff, p5, minPlatformWidth, maxPlatformWidth));
    }

    while (currentX < endX && chunksGenerated < maxChunks) {
        console.log(`--- Generating Chunk ${chunksGenerated + 1} (Difficulty ${difficulty}) ---`);
        
        // Select a random chunk generator function
        const chunkGenerator = p.random(availableChunks);
        
        // Generate the chunk elements, passing current exit point and difficulty
        const chunkElements = chunkGenerator(currentX, currentY, difficulty, p);
        
        // Add elements from the chunk to the level
        level.platforms.push(...chunkElements.platforms);
        level.stars.push(...chunkElements.stars);
        level.enemies.push(...chunkElements.enemies);
        level.hazards.push(...chunkElements.hazards);
        level.powerups.push(...chunkElements.powerups); // Though current chunks don't add powerups

        // Update current position and last platform based on the chunk's exit
        currentX = chunkElements.exitX;
        currentY = chunkElements.exitY;
        lastPlatform = chunkElements.lastPlatform || lastPlatform; // Use chunk's last platform if it exists
        platformsGenerated += chunkElements.platforms.length;
        chunksGenerated++;

        console.log(` Chunk finished. New currentX: ${currentX.toFixed(0)}`);
    }
    
    // --- Final Platform (goal) ---
    // Place it relative to the last chunk's exit
    const finalX = currentX + p.random(150, 250); // Gap after last chunk
    const finalY = p.random(p.height * 0.35, p.height - 250); // Random Y within allowed range
    const finalPlatform = {
        x: finalX,
        y: finalY,
        width: 150,
        height: 20,
        isGoalPlatform: true // Mark as goal
    };
    level.platforms.push(finalPlatform);
    
    // Add mandatory powerup to final platform
    const powerupTypes = ['speedBoost', 'highJump', 'invincibility'];
    const powerupType = powerupTypes[Math.floor(p.random(powerupTypes.length))];
    level.powerups.push({
        type: powerupType,
        x: finalPlatform.x,
        y: finalPlatform.y - 30
    });
    
    // Final verification
    console.log(`Generated level (chunk-based) contains: ${level.platforms.length - 1} platforms, ${level.stars.length} stars, ${level.enemies.length} enemies, ${level.hazards.length} hazards. Target EndX: ${endX.toFixed(0)}, Actual End Platform X: ${finalX.toFixed(0)}`);
    
    return level;
};

// Export the generator function
module.exports = { generateLevel };

/**
 * Sound File Checker and Fixer for Defend Your Farm
 * This script checks for missing sound files and creates placeholders
 * Run with: node fix-missing-sounds.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// List of required sound files according to SoundManager.js
const requiredSounds = [
  // Music
  'farm_bgm.mp3',
  
  // UI sounds
  'ui_click.mp3',
  'coins.mp3',
  'error.mp3',
  
  // Game sounds
  'plant.mp3',
  'harvest.mp3',
  'enemy_hit.mp3',
  'enemy_defeat.mp3',
  'enemy_escaped.mp3',
  'wave_start.mp3',
  'wave_complete.mp3',
  
  // Defense sounds
  'defense_placed.mp3',
  'scarecrow_attack.mp3',
  'dog_attack.mp3',
  'wizard_attack.mp3',
  'cannon_attack.mp3',
  
  // Special attack sounds
  'ice_attack.mp3',
  'fire_attack.mp3',
  'explosion.mp3',
  'freeze.mp3',
  
  // Win/lose sounds
  'victory.mp3',
  'game_over.mp3'
];

// Map of which sounds can substitute for missing ones
const fallbackSounds = {
  'coins.mp3': ['s1_ce.mp3', 'victory.mp3'],
  'error.mp3': ['game_over.mp3', 'enemy_escaped.mp3'],
  'enemy_hit.mp3': ['obelisk_hit_03.mp3', 'thats-amazing.mp3'],
  'defense_placed.mp3': ['ui_click.mp3', 'respawn1 (2).mp3'],
  'plant.mp3': ['respawn1 (2).mp3', 's1_a0.mp3'],
  'harvest.mp3': ['victory.mp3', 's1_c6.mp3'],
  'enemy_defeat.mp3': ['enemy_escaped.mp3', 'victory.mp3'],
  'wave_start.mp3': ['victory.mp3', 'game_over.mp3'],
  'wave_complete.mp3': ['victory.mp3', 'game_over.mp3'],
  'scarecrow_attack.mp3': ['dog_attack.mp3', 'fire_attack.mp3'],
  'dog_attack.mp3': ['fire_attack.mp3', 'ice_attack.mp3'],
  'wizard_attack.mp3': ['ice_attack.mp3', 'scarecrow_attack.mp3'],
  'cannon_attack.mp3': ['explosion.mp3', 'game_over.mp3'],
  'ice_attack.mp3': ['freeze.mp3', 'explosion.mp3'],
  'fire_attack.mp3': ['explosion.mp3', 'ice_attack.mp3'],
  'explosion.mp3': ['cannon_attack.mp3', 'victory.mp3'],
  'freeze.mp3': ['ice_attack.mp3', 'victory.mp3']
};

// Run the script
async function main() {
  try {
    // Sound directory path
    const soundDir = path.resolve(__dirname);
    console.log(`Checking sound files in: ${soundDir}`);
    
    // Get list of existing sound files
    const existingFiles = await readdir(soundDir);
    const existingSounds = existingFiles.filter(file => file.endsWith('.mp3'));
    
    console.log(`Found ${existingSounds.length} sound files.`);
    
    // Check for missing sounds
    const missingSounds = requiredSounds.filter(
      sound => !existingSounds.includes(sound)
    );
    
    if (missingSounds.length === 0) {
      console.log('All required sound files are present! ✅');
      return;
    }
    
    console.log(`Found ${missingSounds.length} missing sound files.`);
    
    // Create placeholder files for missing sounds
    for (const missingSound of missingSounds) {
      console.log(`Creating placeholder for: ${missingSound}`);
      
      // Check for duplicate with "копия" in the name
      const copyVariant = existingSounds.find(file => file.includes(missingSound.replace('.mp3', '')) && file.includes('копия'));
      
      if (copyVariant) {
        // Copy from the duplicate
        await copyFile(path.join(soundDir, copyVariant), path.join(soundDir, missingSound));
        console.log(`  ✅ Copied from ${copyVariant}`);
        continue;
      }
      
      // Find a fallback sound
      const fallbacks = fallbackSounds[missingSound] || [];
      let fallbackUsed = false;
      
      for (const fallback of fallbacks) {
        if (existingSounds.includes(fallback)) {
          await copyFile(path.join(soundDir, fallback), path.join(soundDir, missingSound));
          console.log(`  ✅ Used fallback: ${fallback}`);
          fallbackUsed = true;
          break;
        }
      }
      
      // If no fallback found, use any random sound file
      if (!fallbackUsed) {
        // Use a random existing MP3
        const randomSound = existingSounds.find(file => file.endsWith('.mp3'));
        
        if (randomSound) {
          await copyFile(path.join(soundDir, randomSound), path.join(soundDir, missingSound));
          console.log(`  ✅ Used random sound: ${randomSound}`);
        } else {
          console.error(`  ❌ No suitable sound file found to use as placeholder!`);
        }
      }
    }
    
    console.log('\nAll missing sounds have been addressed!');
    console.log('NOTE: These are placeholders only. Replace with proper sound files when available.');
    
  } catch (error) {
    console.error('Error processing sound files:', error);
  }
}

// Run the script
main(); 
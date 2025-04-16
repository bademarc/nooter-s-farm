# Defend Your Farm - Game Component

This is a casual farm defense game built with Phaser.js and integrated with React. Players protect their crops from waves of pests by placing defenses and directly interacting with enemies.

## Features

- Wave-based pest defense gameplay
- Crop planting and resource management
- Multiple defense types (scarecrows, dogs, wizards, cannons)
- Upgrade system for improving defenses and farm capabilities
- Various enemy types with unique behaviors
- Victory and defeat conditions
- Sound effects and music system

## Technical Implementation

The game is implemented as a React component that wraps Phaser.js:

- `FarmGame.js` - React component that initializes and manages the Phaser game
- `scenes/GameScene.js` - Main Phaser scene that handles game logic
- `entities/` - Game object classes:
  - `Crop.js` - Plantable crops that generate income
  - `Enemy.js` - Enemy pests that attack the farm
  - `Defense.js` - Defensive structures that fight enemies
  - `Upgrade.js` - Upgrade system for improving player abilities

## Sound System

The game uses a comprehensive sound system managed by the `SoundManager` utility:

### Key Features
- Background music with volume control
- Sound effects for all game actions:
  - UI interactions (clicks, buttons)
  - Game events (planting, harvesting, enemy attacks)
  - Combat sounds (defenses attacking, enemies being defeated)
  - Special effects for advanced defenses
  - Victory and defeat fanfares
- Mute/unmute functionality
- Volume controls for both effects and music
- Fallback mechanisms for missing audio files

### Usage
```javascript
// Playing a sound effect
this.soundManager.play('enemy_hit');

// With custom options
this.soundManager.play('explosion_sound', { volume: 0.8 });

// Playing background music
this.soundManager.playMusic();

// Toggle muting
this.soundManager.toggleMute();
```

## Required Sound Assets

Sound assets should be placed in `public/assets/sounds/game/`. See `public/assets/sounds/game/README.md` for a complete list of required files and specifications.

## How to Extend

### Adding New Defenses
To add new defense types:
1. Extend the Defense class in `Defense.js`
2. Add new defense type to the toolbar in `GameScene.js`
3. Create appropriate sound effects for the new defense

### Adding New Enemies
To add new enemy types:
1. Extend the Enemy class in `Enemy.js`
2. Add new enemy type to the wave generator in `GameScene.js`
3. Create appropriate sound effects for the new enemy

### Adding New Sound Effects
To add new sound effects:
1. Add the sound file to `public/assets/sounds/game/`
2. Update the `preload` method in `SoundManager.js`
3. Add appropriate sound triggering code where needed

## Defense System

The game now includes an automated defense system that can help protect your farm from enemies. This document explains how to use the defense features.

### Available Defenses

1. **Scarecrow (20 coins)**
   - Effective against birds
   - Longer range (200 pixels)
   - Slower attack speed (2 seconds)
   - Deals 1 damage per attack
   - Visual: Brown rectangle with a scarf emoji 🧣

2. **Dog (30 coins)**
   - Effective against rabbits
   - Medium range (150 pixels)
   - Faster attack speed (1.5 seconds)
   - Deals 2 damage per attack
   - Visual: Brown rectangle with a dog emoji 🐕

### How to Place Defenses

1. Click on one of the defense buttons in the top-right corner of the game
2. Move your cursor to the right side of the screen (defenses can only be placed on the right side)
3. A blue placement indicator will show where the defense will be placed
4. Click to place the defense if you have enough coins
5. To cancel placement mode, click the selected defense button again

### Defense Placement Rules

- Defenses can only be placed on the right side of the screen
- Each defense costs coins to place (Scarecrow: 20, Dog: 30)
- You cannot place defenses on top of each other
- The placement indicator will show:
  - Blue if placement is valid and you have enough coins
  - Yellow if placement is valid but you don't have enough coins
  - Red if placement is invalid (wrong side of screen or already occupied)

### How Defenses Work

- Defenses automatically attack enemies that enter their range
- Each defense can only target specific enemy types:
  - Scarecrows can only target birds
  - Dogs can only target rabbits
- After attacking, defenses have a cooldown period before they can attack again
- Defenses will show a visual attack animation when they target an enemy

### Advanced Defense Strategy

1. Place scarecrows on the right side to catch birds early
2. Place dogs near the middle-right to catch rabbits that get through
3. Focus your manual clicking on enemies that your defenses can't target
4. Balance your spending between planting crops (left side) and placing defenses (right side)

### Resetting the Game

When you reset the game using the "Reset Game" button:
- All defenses are cleared
- All coins are reset to 0
- You'll need to rebuild your defense network from scratch

## Game Controls

- **Left click** on enemies to damage them
- **Left click** on the left side of the screen to plant crops (5 coins each)
- **Left click** on the right side of the screen to place selected defenses
- Use the defense buttons in the top-right to select a defense type

## Tips

- Start by planting crops to generate income
- Place defenses strategically to protect against specific enemy types
- Keep an eye on your coin balance and spend wisely
- Try different defense arrangements to find optimal coverage 
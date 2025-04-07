# Defend Your Farm - Architecture Documentation

## Overview

"Defend Your Farm" is implemented using a hybrid architecture that combines React for UI and application state management with Phaser.js for game rendering and mechanics. This document outlines the architecture of the game component and explains how different parts interact.

## Key Components

### 1. React Components

#### `components/farm-game/FarmGame.jsx`
This is the main React component that serves as the bridge between the React application and the Phaser game.

**Responsibilities:**
- Renders the container for the Phaser game canvas
- Manages the lifecycle of the Phaser game instance (creation/destruction)
- Passes application state (farm coins, etc.) to the Phaser game
- Provides callbacks for the Phaser game to modify application state

**Key Technical Details:**
- Uses React's `useEffect` hook for game initialization and cleanup
- Dynamically imports Phaser to ensure it only runs client-side
- Uses `useRef` to maintain a reference to the game instance across renders
- Passes data via Phaser's registry system to enable communication between React and Phaser

### 2. Phaser Game Components

#### `components/farm-game/scenes/GameScene.js`
The main Phaser scene that handles the core game logic and rendering.

**Responsibilities:**
- Manages the game state (active/inactive, wave number, score, etc.)
- Renders the game UI (coins, wave information, etc.)
- Handles user input for game actions
- Updates the game state based on player actions
- Communicates with React when game events affect application state

**Key Technical Details:**
- Extends Phaser's `Scene` class
- Uses Phaser's registry to access data from React
- Implements lifecycle methods (init, preload, create, update)
- Uses Phaser's built-in UI and input systems

### 3. Future Entity Components

The following components will be implemented in subsequent steps:

#### `components/farm-game/entities/Crop.js`
A class for in-game crops that can be planted, grown, and harvested.

#### `components/farm-game/entities/Enemy.js`
A class for enemies that attack the farm, with different types and behaviors.

#### `components/farm-game/entities/Defense.js`
A class for defensive structures that can be placed to protect crops.

## Data Flow

```
┌──────────────────────┐                  ┌──────────────────────┐
│                      │                  │                      │
│   React Application  │◄─── Callbacks ───┤    Phaser Game       │
│   (Game Context)     │                  │    (GameScene)       │
│                      │─── Props/State ──►                      │
│                      │                  │                      │
└──────────────────────┘                  └──────────────────────┘
```

1. **React to Phaser:**
   - Farm coins and other game state are passed to Phaser via props and registry
   - Farm component passes `addFarmCoins` callback to allow Phaser to update coins

2. **Phaser to React:**
   - Game events (coin earned, game over, etc.) trigger callbacks to update React state
   - Phaser's registry is used as a shared state repository

## Rendering Architecture

1. **React Rendering:** Handles the overall application UI, including:
   - Farm tabs and navigation
   - Game container and UI framework
   - Application-wide state (farm coins, inventory, etc.)

2. **Phaser Rendering:** Handles the actual game visuals, including:
   - Game canvas and WebGL rendering
   - Sprites and animations
   - Game-specific UI elements (score, wave indicators, etc.)
   - Physics and collision detection

## Technical Considerations

1. **Performance Isolation:**
   - Phaser's rendering loop runs independently of React's rendering cycle
   - Heavy game calculations don't block the React UI thread

2. **Responsive Design:**
   - The Phaser game canvas is contained in a responsive container
   - UI elements scale appropriately for different screen sizes

3. **Memory Management:**
   - Proper cleanup when the component unmounts to prevent memory leaks
   - Phaser textures and objects are properly destroyed when not needed

4. **Asset Loading:**
   - Initial implementation uses placeholder assets (colored rectangles, emoji)
   - Future implementation will load proper sprites and animations

## Future Extensions

The architecture is designed to be extensible for future features:

1. **Additional Scenes:**
   - Menu/title scene
   - Game over scene
   - Tutorial scene

2. **Save/Load System:**
   - Integration with the existing save system
   - Persistence of game progress

3. **Enhanced Visual Effects:**
   - Particle systems for impacts and harvests
   - Weather effects that match the farm's current weather
   - Day/night cycle integration

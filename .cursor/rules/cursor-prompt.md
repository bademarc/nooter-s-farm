# Rules for Game Development with Phaser.js

This document outlines the rules for developing a high-quality 2D web game, such as "Defend Your Farm," a casual defense game where players protect crops from waves of pests. These rules are designed for a senior game developer working with **HTML5 Canvas**, **JavaScript** (or **TypeScript**), and **Phaser.js**, focusing on modularity, performance, and maintainability.

## Rules

### 1. Modular Code Structure
- **Description**: Split the codebase into multiple files, each handling a single responsibility.  
  - Place Phaser scenes (e.g., `MenuScene`, `GameScene`) in `/scenes/`.  
  - Store game entities (e.g., `Player.js`, `Enemy.js`) in `/entities/`.  
  - Use ES6 modules (`import`/`export`) to connect files.  
- **Why**: Avoids a single, unmanageable "god file" and improves scalability.

### 2. Phaser Scene Lifecycle
- **Description**: Organize code using Phaser’s lifecycle methods:  
  - `preload`: Load assets (e.g., images, sounds).  
  - `create`: Set up game objects and initial state.  
  - `update`: Manage real-time logic (e.g., movement, collisions).  
- **Why**: Ensures efficient resource loading and clear logic separation.

### 3. Clean Input Handling
- **Description**: Use Phaser’s input system (e.g., `this.input.keyboard`) for controls.  
  - Encapsulate logic in relevant classes (e.g., `Player.handleInput()`).  
  - Limit global event listeners to scene-wide actions.  
- **Why**: Keeps input code organized and object-specific.

### 4. Physics and Collisions
- **Description**: Use Phaser’s Arcade Physics for movement and collisions.  
  - Set up collision groups (e.g., enemies vs. defenses) with callbacks.  
  - Test performance with varying object counts.  
- **Why**: Provides lightweight physics optimized for 2D web games.

### 5. Performance Optimization
- **Description**: Reduce `update` loop overhead:  
  - Implement object pooling for reusable objects (e.g., enemies).  
  - Avoid heavy calculations or DOM interactions during gameplay.  
- **Why**: Ensures smooth performance across devices.

### 6. Asset Management
- **Description**: Organize assets in folders (e.g., `/assets/images/`) and preload them.  
  - Use sprite sheets or texture atlases for efficient rendering.  
- **Why**: Minimizes load times and draw calls.

### 7. Clean Code Practices
- **Description**: Write clear, maintainable code:  
  - Use `camelCase` for variables/functions, `PascalCase` for classes.  
  - Keep functions short and focused.  
  - Define constants (e.g., `const MAX_ENEMIES = 50`) instead of magic numbers.  
- **Why**: Improves readability and reduces maintenance effort.

### 8. Type Safety (TypeScript)
- **Description**: If using TypeScript, define types/interfaces (e.g., `interface Enemy { hp: number; speed: number; }`).  
  - Leverage Phaser’s TypeScript definitions.  
- **Why**: Enhances reliability and IDE support.

### 9. Networking (If Applicable)
- **Description**: For multiplayer features:  
  - Use WebSockets or `socket.io` for real-time communication.  
  - Serialize data efficiently (e.g., minimal JSON).  
  - Handle dropped connections with reconnection logic.  
- **Why**: Ensures robust, low-latency networking.

### 10. Testing and Debugging
- **Description**: Test key mechanics (e.g., spawning, resources) with unit tests.  
  - Use Phaser’s debug tools (e.g., `debug.physics`).  
  - Check compatibility across browsers (Chrome, Firefox, etc.).  
- **Why**: Delivers a stable, cross-platform experience.

## Key Takeaways
- **Modularity**: Multiple files prevent a monolithic structure, making the code easier to manage.  
- **Optimization**: Techniques like object pooling and asset batching ensure high performance.  
- **Clean Code**: Consistent practices reduce technical debt and improve collaboration.

These rules ensure "Defend Your Farm" is a performant, maintainable, and enjoyable game built with Phaser.js.
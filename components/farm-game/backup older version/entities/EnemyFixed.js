'use client';

// Main Enemy class that can be imported as a default export
export default class Enemy {
  constructor(scene, type, x, y) {
    // Bind all methods to this instance to avoid context loss
    this.update = this.update.bind(this);
    this.damage = this.damage.bind(this);
    this.endGame = this.endGame.bind(this);
    this.destroy = this.destroy.bind(this);
    
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.speed = 1.5;
    this.health = 3;
    this.maxHealth = 3;
    this.damageAmount = 1; // Renamed to avoid conflict with method name
    this.value = type === 'bird' ? 8 : 5; // Birds worth more coins
    
    // Adjust properties based on type
    if (type === 'bird') {
      this.speed = 2;
      this.health = 2;
      this.maxHealth = 2;
    } else if (type === 'rabbit') {
      this.speed = 1.5;
      this.health = 3;
      this.maxHealth = 3;
    }
    
    // Create visual representation - different colors for different types
    const color = type === 'bird' ? 0x3498db : 0x9b59b6; // blue for birds, purple for rabbits
    this.sprite = scene.add.circle(x, y, 15, color);
    
    // Add health bar
    this.healthBar = {
      background: scene.add.rectangle(x, y - 20, 30, 4, 0xFF0000),
      fill: scene.add.rectangle(x, y - 20, 30, 4, 0x00FF00)
    };
    
    // Show type icon
    this.typeText = scene.add.text(x, y, type === 'bird' ? '🐦' : '🐰', {
      fontSize: '16px',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    console.log(`Enemy created: ${type} at ${x},${y} with speed ${this.speed}`);
  }
  
  update() {
    try {
      // Move towards left side of screen (towards the farm)
      this.x -= this.speed;
      
      // Update visual elements
      if (this.sprite) this.sprite.x = this.x;
      if (this.typeText) this.typeText.x = this.x;
      
      // Update health bar
      if (this.healthBar) {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.background.x = this.x;
        this.healthBar.fill.width = 30 * healthPercent;
        this.healthBar.fill.x = this.x - 15 + (this.healthBar.fill.width / 2);
        this.healthBar.background.y = this.y - 20;
        this.healthBar.fill.y = this.y - 20;
      }
      
      // Check if enemy has reached left side
      if (this.x < 0) {
        // Reduce player lives
        if (this.scene.gameState) {
          this.scene.gameState.lives--;
          this.scene.updateLivesText();
          
          // Show warning text
          if (this.scene.showFloatingText) {
            this.scene.showFloatingText(50, 300, 'Farm Invaded! -1 Life', 0xFF0000);
          }
          
          // Check for game over condition
          if (this.scene.gameState.lives <= 0) {
            this.endGame();
          }
        }
        
        // Remove enemy
        this.destroy();
        
        // Remove from game's enemies array
        if (this.scene.enemies && Array.isArray(this.scene.enemies)) {
          this.scene.enemies = this.scene.enemies.filter(e => e !== this);
        }
      }
    } catch (error) {
      console.error("Error in enemy update:", error);
    }
  }
  
  damage(amount) {
    try {
      console.log(`Enemy taking damage: ${amount}, current health: ${this.health}`);
      this.health -= amount;
      
      // Hit effect
      if (this.sprite && this.scene && this.scene.tweens) {
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.5,
          duration: 100,
          yoyo: true
        });
      }
      
      // Update health bar immediately to show full damage
      if (this.healthBar) {
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        this.healthBar.fill.width = 30 * healthPercent;
        this.healthBar.fill.x = this.x - 15 + (this.healthBar.fill.width / 2);
      }
      
      if (this.health <= 0) {
        console.log("Enemy defeated!");
        // Make sure to call destroy immediately
        this.destroy();
        // Remove from scene's enemies array
        if (this.scene.enemies && Array.isArray(this.scene.enemies)) {
          this.scene.enemies = this.scene.enemies.filter(e => e !== this);
        }
        return true; // Enemy was defeated
      }
      
      return false;
    } catch (error) {
      console.error("Error in enemy damage:", error);
      return false;
    }
  }
  
  endGame() {
    try {
      // End the game when player runs out of lives
      if (this.scene.gameState) {
        this.scene.gameState.isActive = false;
      }
      
      // Display game over message
      const gameOverText = this.scene.add.text(400, 300, 'GAME OVER', {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#FF0000'
      }).setOrigin(0.5);
      
      // Show score
      const scoreText = this.scene.add.text(400, 350, `Final Score: ${this.scene.gameState ? this.scene.gameState.score : 0}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      
      // Show restart button
      const restartButton = this.scene.add.rectangle(400, 420, 200, 50, 0xFFFFFF);
      const restartText = this.scene.add.text(400, 420, 'Restart Game', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#000000'
      }).setOrigin(0.5);
      
      restartButton.setInteractive();
      restartButton.on('pointerdown', () => {
        // Reset game state
        this.scene.scene.restart();
      });
    } catch (error) {
      console.error("Error in enemy endGame:", error);
    }
  }
  
  destroy() {
    try {
      console.log("Destroying enemy at", this.x, this.y);
      // Clean up sprites with immediate destruction
      if (this.sprite) {
        this.sprite.destroy();
        this.sprite = null;
      }
      
      if (this.typeText) {
        this.typeText.destroy();
        this.typeText = null;
      }
      
      if (this.healthBar) {
        if (this.healthBar.background) {
          this.healthBar.background.destroy();
          this.healthBar.background = null;
        }
        if (this.healthBar.fill) {
          this.healthBar.fill.destroy();
          this.healthBar.fill = null;
        }
        this.healthBar = null;
      }
    } catch (error) {
      console.error("Error destroying enemy:", error);
    }
  }
} 
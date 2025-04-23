'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Phaser from 'phaser';

// Type declarations for Phaser objects
declare global {
  interface Window {
    Phaser: any;
    game: any;
  }
}

// Dynamically import FarmGame with SSR disabled
const FarmGame = dynamic(
  () => import('./FarmGame').then((mod) => mod.default || mod),
  { ssr: false, loading: () => <LoadingPlaceholder /> }
);

// Loading placeholder component
function LoadingPlaceholder() {
  return (
    <div className="w-full max-w-[800px] h-[600px] md:h-[600px] h-[400px] flex items-center justify-center bg-black/20 border border-white/10 overflow-hidden">
      <div className="text-white text-center px-4">
        <div className="mb-4">Loading farm defense game...</div>
        <div className="text-sm text-white/60">Please wait while we load the game</div>
      </div>
    </div>
  );
}

// Mage attack fix function - integrated from mage-attack-auto-fix.js
function applyMageFixes() {
  if (typeof window === 'undefined') return;

  // Wait for Phaser to be available
  const checkPhaser = setInterval(() => {
    if (window.Phaser) {
      clearInterval(checkPhaser);
      console.log("Phaser detected, applying mage attack fixes...");
      
      const game = window.game || (window.Phaser.Game && window.Phaser.Game.instance);
      if (game) {
        applyFixesToGame(game);
      } else {
        // Wait and try again if game not initialized yet
        setTimeout(() => {
          const game = window.game || (window.Phaser.Game && window.Phaser.Game.instance);
          if (game) applyFixesToGame(game);
        }, 2000);
      }
    }
  }, 500);

  function applyFixesToGame(game: any) {
    if (!game || !game.scene) return;
    
    // Try to find Defense class
    let Defense: any = null;
    
    // Search in all scenes
    game.scene.scenes.forEach((scene: any) => {
      if (scene.Defense) Defense = scene.Defense;
      
      // Look in registry
      if (scene.registry && scene.registry.get && scene.registry.get('Defense')) {
        Defense = scene.registry.get('Defense');
      }
      
      // Look for mage objects to find their constructor
      if (scene.children && scene.children.list) {
        const mageObj = scene.children.list.find(
          (child: any) => child.type === 'mage' || 
                 (child.getData && child.getData('type') === 'mage')
        );
        
        if (mageObj && mageObj.constructor) {
          Defense = mageObj.constructor;
        }
      }
    });
    
    // Apply fixes if Defense class found
    if (Defense && Defense.prototype) {
      fixDefenseClass(Defense);
    } else {
      // Apply fixes to individual mage objects
      fixMageObjects(game);
    }
    
    // Fix selection tool
    fixSelectionTool(game);
    
    // Apply fixes again after a delay to make sure they stick
    setTimeout(() => {
      if (Defense && Defense.prototype) {
        fixDefenseClass(Defense);
      } else {
        fixMageObjects(game);
      }
      fixSelectionTool(game);
    }, 3000);
  }
  
  function fixDefenseClass(Defense: any) {
    // Skip if already patched
    if (Defense._mageFixed) return;
    Defense._mageFixed = true;
    
    console.log("Found Defense class, applying patches...");

    // Fix projectile creation to handle null radius error
    if (typeof Defense.prototype.createProjectile === 'function') {
      const originalCreateProjectile = Defense.prototype.createProjectile;
      
      Defense.prototype.createProjectile = function(enemy: any) {
        try {
          // Skip if scene or enemy is missing
          if (!this.scene || !this.scene.add || !enemy) {
            console.log("Missing scene or enemy, skipping projectile creation");
            return null;
          }
          
          // Create projectile with error handling
          let projectile;
          try {
            if (this.scene.textures && this.scene.textures.exists('projectile')) {
              projectile = this.scene.add.sprite(this.x, this.y, 'projectile');
            } else {
              // Create a circle with safe radius value
              projectile = this.scene.add.circle(this.x, this.y, 5, 0x00ffff);
            }
          } catch (e) {
            console.error("Error creating projectile:", e);
            // Try rectangle as fallback (doesn't need radius)
            try {
              projectile = this.scene.add.rectangle(this.x, this.y, 10, 10, 0x00ffff);
            } catch (e2) {
              console.error("Fallback projectile failed:", e2);
              return null;
            }
          }
          
          if (!projectile) return null;
          
          // Set up projectile properties
          projectile.setDepth(5);
          projectile.targetEnemy = enemy;
          projectile.damage = this.damage || 15;
          
          // Get safe enemy position
          const enemyX = enemy.x || (enemy.container && enemy.container.x) || 
                        (enemy.sprite && enemy.sprite.x) || 400;
          const enemyY = enemy.y || (enemy.container && enemy.container.y) || 
                        (enemy.sprite && enemy.sprite.y) || 300;
          
          // Set up projectile physics
          const dx = enemyX - this.x;
          const dy = enemyY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
          const speed = 5;
          projectile.vx = (dx / distance) * speed;
          projectile.vy = (dy / distance) * speed;
          
          // Add to scene projectiles
          if (!this.scene.projectiles) this.scene.projectiles = [];
          this.scene.projectiles.push(projectile);
          
          // Update function
          projectile.update = function(delta: number) {
            delta = delta || 1/60; // Default delta if missing
            
            // Move projectile
            this.x += this.vx * delta;
            this.y += this.vy * delta;
            
            const enemy = this.targetEnemy;
            if (!enemy || !enemy.active) {
              this.destroy();
              return;
            }
            
            // Hit detection with safe position access
            const hitX = enemy.x || (enemy.container && enemy.container.x) || 
                        (enemy.sprite && enemy.sprite.x);
            const hitY = enemy.y || (enemy.container && enemy.container.y) || 
                        (enemy.sprite && enemy.sprite.y);
            
            if (hitX && hitY) {
              const dx = this.x - hitX;
              const dy = this.y - hitY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 30) {
                // Hit enemy
                if (typeof enemy.takeDamage === 'function') {
                  enemy.takeDamage(this.damage);
                }
                this.destroy();
              }
            }
            
            // Destroy if offscreen
            if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
              this.destroy();
            }
          };
          
          return projectile;
        } catch (error) {
          console.error("Error in createProjectile:", error);
          // Try original as fallback
          try {
            return originalCreateProjectile.call(this, enemy);
          } catch (e) {
            return null;
          }
        }
      };
    }
    
    // Fix attackNearestEnemy to make mages always attack
    if (typeof Defense.prototype.attackNearestEnemy === 'function') {
      Defense.prototype.attackNearestEnemy = function(forceAttack = false) {
        // Always force attack for mages
        if (this.type === 'mage') forceAttack = true;
        
        // Skip if on cooldown (unless forced)
        if (this.cooldown > 0 && !forceAttack) return false;
        
        // Find enemies
        const enemies = this.scene.enemies || [];
        if (enemies.length === 0) return false;
        
        // Use larger range for mages
        const range = this.type === 'mage' ? 500 : (this.range || 100);
        
        // Find nearest enemy
        let nearest = null;
        let nearestDist = range;
        
        for (const enemy of enemies) {
          if (!enemy || !enemy.active) continue;
          
          // Get valid enemy position
          const enemyX = enemy.x || (enemy.container && enemy.container.x) || 
                        (enemy.sprite && enemy.sprite.x);
          const enemyY = enemy.y || (enemy.container && enemy.container.y) || 
                        (enemy.sprite && enemy.sprite.y);
          
          if (!enemyX || !enemyY) continue;
          
          // Calculate distance
          const dx = this.x - enemyX;
          const dy = this.y - enemyY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < nearestDist) {
            nearest = enemy;
            nearestDist = dist;
          }
        }
        
        // Attack if enemy found
        if (nearest) {
          // Set cooldown based on type
          this.cooldown = this.type === 'mage' ? 
                        (this.attackSpeed ? Math.max(0.1, this.attackSpeed / 2) : 0.5) :
                        (this.attackSpeed || 1);
          
          if (typeof this.attack === 'function') {
            this.attack(nearest);
            return true;
          }
        }
        
        return false;
      };
    }
    
    // Fix update method for mages
    if (typeof Defense.prototype.update === 'function') {
      const originalUpdate = Defense.prototype.update;
      
      Defense.prototype.update = function(delta: number) {
        delta = delta || 1/60;
        
        // Force mages to be active
        if (this.type === 'mage') {
          this.active = true;
          
          // Always try to attack for mages
          this.attackNearestEnemy(true);
        }
        
        // Call original update
        originalUpdate.call(this, delta);
      };
    }
  }
  
  // Fix individual mage objects if Defense class not found
  function fixMageObjects(game: any) {
    console.log("Using fallback method to fix mage objects");
    
    if (game.scene && game.scene.scenes) {
      game.scene.scenes.forEach((scene: any) => {
        if (!scene.children || !scene.children.list) return;
        
        // Find mage objects
        const mages = scene.children.list.filter(
          (obj: any) => obj.type === 'mage' || 
                (obj.getData && obj.getData('type') === 'mage')
        );
        
        mages.forEach((mage: any) => {
          if (!mage._fixed) {
            mage._fixed = true;
            
            // Add attack method if missing
            if (!mage.attack) {
              mage.attack = function(enemy: any) {
                this.createProjectile(enemy);
              };
            }
            
            // Add safe createProjectile method
            if (!mage.createProjectile) {
              mage.createProjectile = function(enemy: any) {
                try {
                  const projectile = scene.add.circle(this.x, this.y, 5, 0x00ffff);
                  projectile.setDepth(5);
                  
                  // Basic tracking logic
                  projectile.update = function() {
                    const enemyX = enemy.x || (enemy.container && enemy.container.x) || 400;
                    const enemyY = enemy.y || (enemy.container && enemy.container.y) || 300;
                    
                    // Move toward enemy
                    const speed = 3;
                    const dx = enemyX - this.x;
                    const dy = enemyY - this.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    
                    this.x += (dx/dist) * speed;
                    this.y += (dy/dist) * speed;
                    
                    // Hit detection
                    if (dist < 20) {
                      if (typeof enemy.takeDamage === 'function') {
                        enemy.takeDamage(10);
                      }
                      this.destroy();
                    }
                  };
                  
                  if (!scene.projectiles) scene.projectiles = [];
                  scene.projectiles.push(projectile);
                  
                  return projectile;
                } catch (e) {
                  console.error("Error creating projectile:", e);
                  return null;
                }
              };
            }
          }
        });
      });
    }
  }
  
  // Fix the selection tool
  function fixSelectionTool(game: any) {
    if (!game.scene || !game.scene.scenes) return;
    
    game.scene.scenes.forEach((scene: any) => {
      if (!scene.input) return;
      
      // Ensure input is enabled
      scene.input.enabled = true;
      
      // Make objects interactive
      if (scene.children && scene.children.list) {
        scene.children.list.forEach((obj: any) => {
          // Skip text and UI elements
          if (obj.type === 'Text' || obj.type === 'Graphics') return;
          
          if (obj.setInteractive) {
            try {
              obj.setInteractive({ useHandCursor: true });
              
              // Add hover effects with check for method existence
              obj.on('pointerover', function(this: Phaser.GameObjects.GameObject) { 
                // Check if setTint exists before calling
                if (typeof (this as any).setTint === 'function') { 
                  (this as any).setTint(0xddddff);
                }
              });
              
              obj.on('pointerout', function(this: Phaser.GameObjects.GameObject) { 
                // Check if clearTint exists before calling
                if (typeof (this as any).clearTint === 'function') { 
                  (this as any).clearTint();
                }
              });
            } catch (e) {
              // Ignore errors
            }
          }
        });
      }
      
      // Improve pointer handling
      if (scene.input.on) {
        scene.input.on('gameobjectdown', function(pointer: any, gameObject: any) {
          // Visual feedback
          if (gameObject.setTint) {
            gameObject.setTint(0xffff00);
            setTimeout(() => {
              // FIX: Check if gameObject still exists and has clearTint before calling
              if (gameObject && gameObject.active && typeof gameObject.clearTint === 'function') {
                 gameObject.clearTint();
              }
            }, 200);
          }
        });
      }
    });
  }
}

// Game Over z-index fix function
function fixGameOverZIndex() {
  if (typeof window === 'undefined') return;

  // Wait for Phaser to be available
  const checkInterval = setInterval(() => {
    if (window.Phaser) {
      clearInterval(checkInterval);
      applyZIndexFix();
    }
  }, 500);

  function applyZIndexFix() {
    const game = window.game || (window.Phaser.Game && window.Phaser.Game.instance);
    if (!game || !game.scene) return;
    
    const fixScene = (scene: any) => {
      if (!scene || !scene.children || !scene.children.list) return;
      
      // Get highest depth used by game elements
      let maxDepth = 10;
      scene.children.list.forEach((child: any) => {
        if (child.depth > maxDepth) maxDepth = child.depth;
      });
      
      // Set UI elements to higher depth
      const uiDepth = maxDepth + 1000;
      
      scene.children.list.forEach((child: any) => {
        // Fix text elements
        if (child.type === 'Text' && typeof child.setDepth === 'function') {
          if (child.text && (
              child.text.includes('GAME OVER') || 
              child.text.includes('Game Over') ||
              child.text.includes('Score') ||
              child.text.toLowerCase().includes('restart'))) {
            child.setDepth(uiDepth);
          } else {
            child.setDepth(uiDepth - 100);
          }
        }
        
        // Fix UI containers
        if (child.type === 'Container' && typeof child.setDepth === 'function') {
          if (child.name && (
              child.name.includes('UI') || 
              child.name.includes('over') || 
              child.name.includes('Game'))) {
            child.setDepth(uiDepth);
          }
        }
      });
    };
    
    // Apply to all scenes
    game.scene.scenes.forEach(fixScene);
    
    // Watch for scene changes
    if (window.Phaser.Scene && window.Phaser.Scene.prototype) {
      const originalStart = window.Phaser.Scene.prototype.start;
      window.Phaser.Scene.prototype.start = function() {
        originalStart.apply(this, arguments);
        setTimeout(() => fixScene(this), 100);
      };
    }
    
    // Reapply fix periodically to catch game over screen
    setInterval(() => {
      if (game.scene && game.scene.scenes) {
        game.scene.scenes.forEach(fixScene);
      }
    }, 1000);
  }
}

// Client-side wrapper component
export default function ClientWrapper({ farmCoins, addFarmCoins }: { 
  farmCoins: number, 
  addFarmCoins: (amount: number) => void 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    console.log("ClientWrapper mounted");
    setIsMounted(true);
    
    // Check if we're on a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Apply all game fixes after mounting
    applyMageFixes();
    fixGameOverZIndex();
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Only render the FarmGame component on the client
  if (!isMounted) {
    return <LoadingPlaceholder />;
  }
  
  console.log("Rendering FarmGame with coins:", farmCoins, "Mobile:", isMobile);
  return (
    <div className={`farm-game-container w-full ${isMobile ? 'mobile-view' : ''}`}>
      <FarmGame farmCoins={farmCoins} addFarmCoins={addFarmCoins} />
    </div>
  );
} 
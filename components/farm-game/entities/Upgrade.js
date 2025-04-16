'use client';

export default class Upgrade {
  constructor(scene) {
    this.scene = scene;
    
    // Set initial upgrade levels
    this.levels = {
      clickDamage: 1,     // Player's direct attack strength
      cropYield: 1,       // How much coins crops generate
      scarecrowPower: 1,  // Scarecrow defense power
      dogPower: 1,        // Dog defense power
      cropGrowth: 1,      // How fast crops grow
      wizardPower: 1,     // Wizard defense power - advanced defense
      cannonPower: 1      // Cannon defense power - advanced defense
    };
    
    // Define max levels for each upgrade
    this.maxLevels = {
      clickDamage: 5,
      cropYield: 5,
      scarecrowPower: 3,
      dogPower: 3,
      cropGrowth: 3,
      wizardPower: 3,     // Added for wizard
      cannonPower: 3      // Added for cannon
    };
    
    // Define costs for each upgrade level
    this.costs = {
      clickDamage: [50, 100, 200, 350, 600],
      cropYield: [75, 150, 250, 400, 700],
      scarecrowPower: [100, 250, 500],
      dogPower: [120, 280, 550],
      cropGrowth: [80, 180, 350],
      wizardPower: [200, 400, 650],  // Higher cost for advanced defense
      cannonPower: [250, 500, 750]   // Higher cost for advanced defense
    };
    
    // Define unlocked status for advanced defenses
    this.unlockedDefenses = {
      scarecrow: true,  // Basic defense, starts unlocked
      dog: true,        // Basic defense, starts unlocked
      wizard: false,    // Advanced defense, needs to be unlocked
      cannon: false     // Advanced defense, needs to be unlocked
    };
    
    // Define unlock conditions for advanced defenses
    this.unlockRequirements = {
      wizard: { wave: 5, cost: 350 },  // Reduced from 500
      cannon: { wave: 8, cost: 600 }   // Reduced from 750
    };
    
    // Initialize UI elements
    this.uiElements = {};
    
    console.log("Upgrade system initialized");
  }
  
  // Get the value of an upgrade based on its level
  getUpgradeValue(type) {
    const level = this.levels[type];
    
    switch (type) {
      case 'clickDamage':
        return 0.5 + (level * 0.5); // Starts at 1.0, +0.5 per level
      case 'cropYield':
        return 1 + (level * 0.25); // Starts at 1.25, +0.25 per level
      case 'scarecrowPower':
        return 1 + (level * 0.5); // Starts at 1.5, +0.5 per level
      case 'dogPower':
        return 1 + (level * 0.6); // Starts at 1.6, +0.6 per level
      case 'cropGrowth':
        return 1 + (level * 0.2); // Starts at 1.2, +0.2 per level
      case 'wizardPower':
        return 1 + (level * 0.7); // Starts at 1.7, +0.7 per level (stronger than base defenses)
      case 'cannonPower':
        return 1 + (level * 0.8); // Starts at 1.8, +0.8 per level (strongest defense upgrade)
      default:
        return 1;
    }
  }
  
  // Get the cost to upgrade to the next level
  getUpgradeCost(type) {
    const currentLevel = this.levels[type];
    if (currentLevel >= this.maxLevels[type]) {
      return Infinity; // Max level reached
    }
    
    return this.costs[type][currentLevel - 1];
  }
  
  // Check if an upgrade can be purchased
  canUpgrade(type) {
    const currentLevel = this.levels[type];
    const maxLevel = this.maxLevels[type];
    const cost = this.getUpgradeCost(type);
    
    // Check if max level is reached
    if (currentLevel >= maxLevel) {
      return false;
    }
    
    // Check if player has enough coins
    return this.scene.gameState.farmCoins >= cost;
  }
  
  // Perform an upgrade
  upgrade(type) {
    if (!this.canUpgrade(type)) {
      console.log(`Cannot upgrade ${type} - max level reached or insufficient funds`);
      return false;
    }
    
    const cost = this.getUpgradeCost(type);
    
    // Deduct coins
    this.scene.updateFarmCoins(-cost);
    
    // Increase level
    this.levels[type]++;
    
    // Apply upgrade effects
    this.applyUpgradeEffects(type);
    
    // Update UI
    this.updateUI();
    
    console.log(`Upgraded ${type} to level ${this.levels[type]}`);
    
    // Show floating text
    const screenCenterX = this.scene.cameras.main.worldView.x + this.scene.cameras.main.width / 2;
    const screenCenterY = this.scene.cameras.main.worldView.y + this.scene.cameras.main.height / 2;
    this.scene.showFloatingText(screenCenterX, screenCenterY - 50, `${type} Upgraded!`, 0x00FF00);
    
    return true;
  }
  
  // Apply effects of an upgrade
  applyUpgradeEffects(type) {
    const value = this.getUpgradeValue(type);
    
    switch (type) {
      case 'clickDamage':
        this.scene.gameState.clickDamage = value;
        break;
      case 'cropYield':
        // Update all existing crops
        if (this.scene.crops) {
          Object.values(this.scene.crops).forEach(crop => {
            if (crop && crop.updateYield) {
              crop.updateYield(value);
            }
          });
        }
        break;
      case 'scarecrowPower':
      case 'dogPower':
      case 'wizardPower':
      case 'cannonPower':
        // Update all existing defenses of this type
        if (this.scene.defenses) {
          this.scene.defenses.forEach(defense => {
            if (defense && defense.type === type.replace('Power', '')) {
              if (typeof defense.updatePower === 'function') {
                defense.updatePower(value);
              } else {
                defense.damage = value;
              }
            }
          });
        }
        break;
      case 'cropGrowth':
        // Update all existing crops
        if (this.scene.crops) {
          Object.values(this.scene.crops).forEach(crop => {
            if (crop && crop.updateGrowthRate) {
              crop.updateGrowthRate(value);
            }
          });
        }
        break;
    }
  }
  
  // Check if a defense type is unlocked
  isDefenseUnlocked(type) {
    return this.unlockedDefenses[type] || false;
  }
  
  // Get the cost to unlock a defense
  getDefenseUnlockCost(type) {
    return this.unlockRequirements[type]?.cost || 0;
  }
  
  // Check if a defense can be unlocked
  canUnlockDefense(type) {
    if (this.isDefenseUnlocked(type)) {
      return false; // Already unlocked
    }
    
    const requirements = this.unlockRequirements[type];
    if (!requirements) {
      return false; // No requirements defined
    }
    
    // Check wave requirement
    if (this.scene.gameState.wave < requirements.wave) {
      return false;
    }
    
    // Check coin requirement
    return this.scene.gameState.farmCoins >= requirements.cost;
  }
  
  // Unlock a defense type
  unlockDefense(type) {
    if (!this.canUnlockDefense(type)) {
      console.log(`Cannot unlock ${type} defense - requirements not met`);
      return false;
    }
    
    const cost = this.getDefenseUnlockCost(type);
    
    // Deduct coins
    this.scene.updateFarmCoins(-cost);
    
    // Unlock defense
    this.unlockedDefenses[type] = true;
    
    // Update UI
    this.updateUI();
    
    console.log(`Unlocked ${type} defense`);
    
    // Show floating text
    const screenCenterX = this.scene.cameras.main.worldView.x + this.scene.cameras.main.width / 2;
    const screenCenterY = this.scene.cameras.main.worldView.y + this.scene.cameras.main.height / 2;
    this.scene.showFloatingText(screenCenterX, screenCenterY - 50, `${type} Defense Unlocked!`, 0x00FFFF);
    
    // Update defense buttons visibility in the scene if the method exists
    if (this.scene && typeof this.scene.updateAdvancedDefenseButtons === 'function') {
      this.scene.updateAdvancedDefenseButtons();
    }
    
    return true;
  }
  
  // Create UI for upgrades
  createUI() {
    // Clear existing UI elements
    this.destroyUI();
    
    // Create upgrade panel background
    const panelWidth = 200;
    const panelHeight = this.scene.sys.game.config.height;
    const panelX = this.scene.sys.game.config.width - panelWidth / 2;
    const panelY = panelHeight / 2;
    
    this.uiElements.panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x333333, 0.8);
    this.uiElements.panel.setDepth(1000); // Ensure panel is above game elements
    
    // Title
    this.uiElements.title = this.scene.add.text(panelX, 20, 'UPGRADES', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.uiElements.title.setDepth(1001); // Ensure title is above panel
    
    // Create buttons for each upgrade
    this.createUpgradeButtons();
    
    // Set visibility
    this.setUIVisible(false);
  }
  
  // Create buttons for each upgrade
  createUpgradeButtons() {
    const panelX = this.uiElements.panel.x;
    const startY = 60;
    const buttonHeight = 40;
    const spacing = 10;
    let currentY = startY;
    
    // Get list of available upgrades (filter out advanced defense power upgrades if not unlocked)
    const availableUpgrades = Object.keys(this.levels).filter(type => {
      // Always show base upgrades
      if (!type.includes('Power') || type === 'scarecrowPower' || type === 'dogPower' || type === 'cropGrowth') {
        return true;
      }
      
      // For advanced defense power upgrades, check if defense is unlocked
      const defenseType = type.replace('Power', '');
      return this.isDefenseUnlocked(defenseType);
    });
    
    // Create upgrade buttons for available upgrades
    availableUpgrades.forEach((type, index) => {
      const buttonY = currentY;
      
      // Button background
      const button = this.scene.add.rectangle(panelX, buttonY, 180, buttonHeight, 0x555555);
      button.setInteractive();
      button.on('pointerdown', () => this.upgrade(type));
      button.setDepth(1001); // Ensure button is above panel
      
      // Button text
      const level = this.levels[type];
      const maxLevel = this.maxLevels[type];
      const cost = this.getUpgradeCost(type);
      const text = this.scene.add.text(panelX - 85, buttonY - 10, `${this.formatUpgradeName(type)} (${level}/${maxLevel})`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#FFFFFF'
      });
      text.setDepth(1001); // Ensure text is above panel
      
      // Cost text
      const costText = level < maxLevel 
        ? this.scene.add.text(panelX - 85, buttonY + 5, `Cost: ${cost} coins`, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#FFFF00'
          })
        : this.scene.add.text(panelX - 85, buttonY + 5, 'MAXED', {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#00FF00'
          });
      costText.setDepth(1001); // Ensure cost text is above panel
      
      // Store UI elements
      this.uiElements[`${type}Button`] = button;
      this.uiElements[`${type}Text`] = text;
      this.uiElements[`${type}CostText`] = costText;
      
      currentY += buttonHeight + spacing;
    });
    
    // Create separator
    const separator = this.scene.add.rectangle(panelX, currentY, 180, 2, 0xFFFFFF, 0.5);
    this.uiElements.separator = separator;
    separator.setDepth(1001); // Ensure separator is above panel
    currentY += spacing * 2;
    
    // Create unlock defense buttons
    Object.keys(this.unlockRequirements).forEach((type, index) => {
      if (this.isDefenseUnlocked(type)) return; // Skip already unlocked
      
      const buttonY = currentY;
      
      // Button background
      const button = this.scene.add.rectangle(panelX, buttonY, 180, buttonHeight, 0x553366);
      button.setInteractive();
      button.on('pointerdown', () => this.unlockDefense(type));
      button.setDepth(1001); // Ensure button is above panel
      
      // Button text
      const requirements = this.unlockRequirements[type];
      const text = this.scene.add.text(panelX - 85, buttonY - 10, `Unlock ${type} Defense`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#FFFFFF'
      });
      text.setDepth(1001); // Ensure text is above panel
      
      // Requirements text
      const reqText = this.scene.add.text(panelX - 85, buttonY + 5, `Req: Wave ${requirements.wave}, ${requirements.cost} coins`, {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#FFAA00'
      });
      reqText.setDepth(1001); // Ensure text is above panel
      
      // Store UI elements
      this.uiElements[`${type}UnlockButton`] = button;
      this.uiElements[`${type}UnlockText`] = text;
      this.uiElements[`${type}UnlockReqText`] = reqText;
      
      currentY += buttonHeight + spacing;
    });
  }
  
  // Format upgrade name for display
  formatUpgradeName(type) {
    switch (type) {
      case 'clickDamage':
        return 'Click Damage';
      case 'cropYield':
        return 'Crop Yield';
      case 'scarecrowPower':
        return 'ABS Mage Power';
      case 'dogPower':
        return 'NOOT Mage Power';
      case 'cropGrowth':
        return 'Crop Growth Rate';
      case 'wizardPower':
        return 'Wizard Power';
      case 'cannonPower':
        return 'Cannon Power';
      default:
        return type;
    }
  }
  
  // Update UI with current information
  updateUI() {
    if (!this.uiElements.panel) return;
    
    // Update upgrade buttons
    Object.keys(this.levels).forEach(type => {
      const level = this.levels[type];
      const maxLevel = this.maxLevels[type];
      const cost = this.getUpgradeCost(type);
      
      // Update text
      if (this.uiElements[`${type}Text`]) {
        this.uiElements[`${type}Text`].setText(`${this.formatUpgradeName(type)} (${level}/${maxLevel})`);
      }
      
      // Update cost
      if (this.uiElements[`${type}CostText`]) {
        if (level < maxLevel) {
          this.uiElements[`${type}CostText`].setText(`Cost: ${cost} coins`);
          this.uiElements[`${type}CostText`].setColor(this.canUpgrade(type) ? '#FFFF00' : '#FF5555');
        } else {
          this.uiElements[`${type}CostText`].setText('MAXED');
          this.uiElements[`${type}CostText`].setColor('#00FF00');
        }
      }
      
      // Update button tint
      if (this.uiElements[`${type}Button`]) {
        if (level < maxLevel) {
          this.uiElements[`${type}Button`].fillColor = this.canUpgrade(type) ? 0x555555 : 0x553333;
        } else {
          this.uiElements[`${type}Button`].fillColor = 0x335533;
        }
      }
    });
    
    // Update unlock defense buttons
    Object.keys(this.unlockRequirements).forEach(type => {
      // Skip if already unlocked or no UI elements
      if (this.isDefenseUnlocked(type) || !this.uiElements[`${type}UnlockButton`]) {
        // Remove UI elements if defense is unlocked
        if (this.isDefenseUnlocked(type)) {
          this.removeDefenseUnlockButton(type);
        }
        return;
      }
      
      // Update button tint
      this.uiElements[`${type}UnlockButton`].fillColor = this.canUnlockDefense(type) ? 0x553366 : 0x442244;
      
      // Update requirement text color
      if (this.uiElements[`${type}UnlockReqText`]) {
        this.uiElements[`${type}UnlockReqText`].setColor(this.canUnlockDefense(type) ? '#FFAA00' : '#FF5555');
      }
    });
  }
  
  // Remove unlock button once a defense is unlocked
  removeDefenseUnlockButton(type) {
    if (this.uiElements[`${type}UnlockButton`]) {
      this.uiElements[`${type}UnlockButton`].destroy();
      delete this.uiElements[`${type}UnlockButton`];
    }
    
    if (this.uiElements[`${type}UnlockText`]) {
      this.uiElements[`${type}UnlockText`].destroy();
      delete this.uiElements[`${type}UnlockText`];
    }
    
    if (this.uiElements[`${type}UnlockReqText`]) {
      this.uiElements[`${type}UnlockReqText`].destroy();
      delete this.uiElements[`${type}UnlockReqText`];
    }
    
    // Recreate UI to reorganize
    this.createUI();
    this.setUIVisible(true);
  }
  
  // Set UI visibility
  setUIVisible(visible) {
    Object.values(this.uiElements).forEach(element => {
      if (element) {
        element.visible = visible;
      }
    });
  }
  
  // Toggle UI visibility
  toggleUI() {
    const isVisible = this.uiElements.panel?.visible;
    this.setUIVisible(!isVisible);
    return !isVisible;
  }
  
  // Destroy UI elements
  destroyUI() {
    Object.values(this.uiElements).forEach(element => {
      if (element) {
        element.destroy();
      }
    });
    
    this.uiElements = {};
  }
  
  // Clean up resources when no longer needed
  destroy() {
    this.destroyUI();
  }
} 
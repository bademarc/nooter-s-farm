'use client';

import * as Phaser from 'phaser';

class VolumeControls {
    /**
     * @param {Phaser.Scene} scene The Phaser Scene to add the controls to.
     * @param {SoundManager} soundManager The SoundManager instance to control.
     */
    constructor(scene, soundManager) {
        this.scene = scene;
        this.soundManager = soundManager;

        this.uiContainer = null;
        this.musicSlider = null;
        this.sfxSlider = null; // Single SFX slider
        this.isVisible = false;

        // Default position - can be adjusted
        this.x = this.scene.cameras.main.width / 2;
        this.y = this.scene.cameras.main.height / 2;
        this.width = 250; // Revert width
        this.height = 150; // Revert height
    }

    createUI() {
        // --- Container ---
        this.uiContainer = this.scene.add.container(this.x, this.y);
        this.uiContainer.setDepth(2000); // Ensure it's above most game elements

        const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7);
        bg.setStrokeStyle(2, 0xffffff);
        this.uiContainer.add(bg);

        // --- Title ---
        const title = this.scene.add.text(0, -this.height / 2 + 20, 'Volume Settings', {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.uiContainer.add(title);

        // Revert slider positions and sizes
        const labelX = -this.width / 2 + 15;
        const sliderX = -this.width / 2 + 75;
        const sliderWidth = this.width - 110; // Use original width calculation

        // --- Music Volume ---
        const musicLabel = this.scene.add.text(labelX, -this.height / 2 + 55, 'Music:', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.uiContainer.add(musicLabel);
        this.musicSlider = this.createSlider(sliderX, -this.height / 2 + 55, sliderWidth, this.soundManager.getMusicVolume(), 'music');
        this.uiContainer.add(this.musicSlider.track);
        this.uiContainer.add(this.musicSlider.handle);
        this.uiContainer.add(this.musicSlider.valueText); // Add value text

        // --- SFX Volume (Single Slider) ---
        const sfxLabel = this.scene.add.text(labelX, -this.height / 2 + 95, 'SFX:', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.uiContainer.add(sfxLabel);
        this.sfxSlider = this.createSlider(sliderX, -this.height / 2 + 95, sliderWidth, this.soundManager.getSfxVolume(), 'sfx');
        this.uiContainer.add(this.sfxSlider.track);
        this.uiContainer.add(this.sfxSlider.handle);
        this.uiContainer.add(this.sfxSlider.valueText);

        // --- Close Button ---
        const closeButton = this.scene.add.text(this.width / 2 - 15, -this.height / 2 + 15, 'X', {
            fontSize: '16px',
            color: '#ff0000',
            backgroundColor: '#555555',
            padding: { x: 5, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.hide());
        this.uiContainer.add(closeButton);

        // --- Initial State ---
        this.uiContainer.setVisible(this.isVisible); // Initially hidden
    }

    /**
     * Creates a slider group.
     * @param {number} x The x position of the slider track.
     * @param {number} y The y position of the slider track.
     * @param {number} width The width of the slider track.
     * @param {number} initialValue The initial volume value (0-1).
     * @param {'music' | 'sfx'} type The type of volume this slider controls.
     * @returns {object} An object containing the track, handle, and valueText GameObjects.
     */
    createSlider(x, y, width, initialValue, type) {
        const trackHeight = 10;
        const handleWidth = 10;
        const handleHeight = 20;

        // Slider track
        const track = this.scene.add.rectangle(x, y, width, trackHeight, 0x555555).setOrigin(0, 0.5);

        // Slider handle - Position based on initial value
        const handleX = x + width * Phaser.Math.Clamp(initialValue, 0, 1);
        const handle = this.scene.add.rectangle(handleX, y, handleWidth, handleHeight, 0xffffff).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.scene.input.setDraggable(handle);

        // Text to display the value
        const valueText = this.scene.add.text(x + width + 15, y, `${Math.round(initialValue * 100)}%`, {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        handle.on('drag', (pointer, dragX) => {
            // Clamp handle position to track bounds
            const newX = Phaser.Math.Clamp(dragX, x, x + width);
            handle.x = newX;

            // Calculate volume (0-1)
            const value = Phaser.Math.Clamp((newX - x) / width, 0, 1);

            // Update SoundManager and UI
            this.updateVolume(type, value);

            // Update text display
            valueText.setText(`${Math.round(value * 100)}%`);
        });

        return { track, handle, valueText };
    }

    updateVolume(type, value) {
        const clampedValue = Phaser.Math.Clamp(value, 0, 1);
        if (type === 'music') {
            this.soundManager.setMusicVolume(clampedValue);
        } else if (type === 'sfx') { // Use 'sfx' type
            this.soundManager.setSfxVolume(clampedValue);
        }
        // Optional: Save to localStorage
        // try { localStorage.setItem(`volume_${type}`, value); } catch (e) {}
    }

    show() {
        if (!this.uiContainer) {
            this.createUI(); // Create if it doesn't exist yet
        }
        // Refresh slider positions based on current volume using getter methods
        this.updateSliderPosition(this.musicSlider, this.soundManager.getMusicVolume());
        this.updateSliderPosition(this.sfxSlider, this.soundManager.getSfxVolume());

        this.uiContainer.setVisible(true);
        this.isVisible = true;
    }

    hide() {
        if (this.uiContainer) {
            this.uiContainer.setVisible(false);
        }
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Helper to update slider handle position and text based on current volume
    updateSliderPosition(slider, value) {
        if (!slider || !slider.track || !slider.handle || !slider.valueText) return;
        const trackX = slider.track.x;
        const trackWidth = slider.track.width;
        const clampedValue = Phaser.Math.Clamp(value, 0, 1);
        slider.handle.x = trackX + trackWidth * clampedValue;
        slider.valueText.setText(`${Math.round(clampedValue * 100)}%`);
    }

    destroy() {
       if (this.uiContainer) {
           this.uiContainer.destroy(); // Destroys all children as well
           this.uiContainer = null;
       }
        this.musicSlider = null;
        this.sfxSlider = null;
    }
}

export default VolumeControls; 
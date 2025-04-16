# Sound System for Defend Your Farm

## Overview

The sound system for "Defend Your Farm" provides a comprehensive solution for audio management. It includes background music, sound effects for game events, volume controls, and a testing panel to ensure all sounds work correctly.

## Components

The sound system consists of these key components:

1. **SoundManager.js** - Core utility that handles loading, playing, and controlling all audio
2. **SoundTestPanel.js** - Developer UI for testing and debugging all sound effects
3. **GameScene.js Integration** - Sound events triggered by gameplay actions
4. **Sound Assets** - Audio files in MP3 format stored in `/public/assets/sounds/game/`
5. **Fix-Missing-Sounds Scripts** - Utility scripts to check for and repair missing sound files

## Using the Sound System

### Playing Sounds

To play a sound effect in game code:

```javascript
// Play a sound effect
this.soundManager.play('enemy_hit');

// Play background music
this.soundManager.playMusic();

// Stop background music
this.soundManager.stopMusic();
```

### Controlling Volume

```javascript
// Set effects volume (0-1)
this.soundManager.setEffectsVolume(0.5);

// Set music volume (0-1)
this.soundManager.setMusicVolume(0.3);

// Mute all sounds
this.soundManager.mute();

// Unmute all sounds
this.soundManager.unmute();

// Toggle mute state
const isMuted = this.soundManager.toggleMute();
```

## Testing Sounds

### Sound Test Panel

The sound test panel allows developers to verify all sounds are working correctly.

To access the panel:
- In game, press **Ctrl+Shift+S** to toggle the panel
- Use the panel to:
  - Test individual sound effects
  - Adjust volume levels
  - Toggle mute/unmute
  - Play/stop background music

### Fixing Missing Sounds

If sounds aren't playing correctly, you may have missing sound files.

1. Navigate to `/public/assets/sounds/game/`
2. Run `fix-missing-sounds.bat` (Windows) or `node fix-missing-sounds.js` (any OS)
3. The script will:
   - Check for missing sound files
   - Create placeholders for any missing files
   - Report which files need attention

## Sound File Reference

| Category | Sound Key | Filename | Description |
|----------|-----------|----------|-------------|
| **Music** | bgm_gameplay | farm_bgm.mp3 | Background music |
| **UI** | click | ui_click.mp3 | Button clicks |
| | coins | coins.mp3 | Coin collection |
| | error | error.mp3 | Error/invalid action |
| **Game** | plant | plant.mp3 | Planting crops |
| | harvest | harvest.mp3 | Harvesting crops |
| | enemy_hit | enemy_hit.mp3 | Enemy hit |
| | enemy_defeat | enemy_defeat.mp3 | Enemy defeated |
| | enemy_escaped | enemy_escaped.mp3 | Enemy escaped |
| | wave_start | wave_start.mp3 | Wave starting |
| | wave_complete | wave_complete.mp3 | Wave completed |
| **Defenses** | defense_placed | defense_placed.mp3 | Place defense |
| | scarecrow_attack | scarecrow_attack.mp3 | Scarecrow attack |
| | dog_attack | dog_attack.mp3 | Dog attack |
| | wizard_attack | wizard_attack.mp3 | Wizard attack |
| | cannon_attack | cannon_attack.mp3 | Cannon attack |
| **Special** | ice_attack | ice_attack.mp3 | Ice attack |
| | fire_attack | fire_attack.mp3 | Fire attack |
| | explosion_sound | explosion.mp3 | Explosion |
| | freeze_sound | freeze.mp3 | Freezing effect |
| **Results** | victory | victory.mp3 | Victory fanfare |
| | game_over | game_over.mp3 | Game over |

## Troubleshooting

If you encounter sound issues:

1. **No sounds playing at all:**
   - Check if the sound is muted (sound icon in game UI)
   - Verify browser permissions for audio playback
   - Check browser console for audio-related errors

2. **Missing specific sounds:**
   - Run the fix-missing-sounds script
   - Check the path to ensure sounds are in the correct directory
   - Verify filename matches the expected sound key

3. **Sound quality issues:**
   - Make sure MP3 files are properly encoded
   - Check volume levels in SoundManager.js
   - Ensure audio files are not corrupted

## Development Guidelines

When adding new sounds:

1. Add the sound file to `/public/assets/sounds/game/`
2. Add the load call in SoundManager.js preload() method
3. Add volume configuration in the soundConfigs object
4. Update the README.md in the sounds directory
5. Test with the Sound Test Panel

## Performance Considerations

- Keep sound effects short (under a few seconds) to minimize memory usage
- Use consistent volume levels to prevent jarring audio experiences
- Consider implementing sound pooling for frequently played effects
- MP3 format provides good compression for web games 
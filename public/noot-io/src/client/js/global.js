module.exports = {
    // Keys
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_CHAT: 13,
    KEY_FIREFOOD: 119,
    KEY_SPLIT: 32,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_Q: 81,
    KEY_W: 87,
    KEY_E: 69,
    KEY_R: 82,
    KEY_T: 84,
    KEY_P: 80,
    KEY_Y: 89,
    KEY_U: 85,
    KEY_I: 73,
    KEY_O: 79,
    KEY_A: 65,
    KEY_S: 83,
    KEY_D: 68,
    KEY_F: 70,
    KEY_G: 71,
    KEY_H: 72,
    KEY_J: 74,
    KEY_K: 75,
    KEY_L: 76,
    KEY_Z: 90,
    KEY_X: 88,
    KEY_C: 67,
    KEY_V: 86,
    KEY_B: 66,
    KEY_N: 78,
    KEY_M: 77,

    // Canvas
    screen: {
        width: window.innerWidth,
        height: window.innerHeight
    },
    
    // Game
    game: {
        width: 0,
        height: 0
    },
    
    // Player
    player: null,
    target: null,
    gameStart: false,
    died: false,
    kicked: false,
    animLoopHandle: null,
    startPingTime: 0,
    mobile: false,
    colors: [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
        '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#FFAB91',
        '#F48FB1', '#CE93D8', '#B39DDB', '#9FA8DA', '#90CAF9'
    ]
}; 
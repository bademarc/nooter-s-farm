var io = require('socket.io-client');
var render = require('./render');
var ChatClient = require('./chat-client');
var Canvas = require('./canvas');
var global = require('./global');

var playerNameInput = document.getElementById('playerNameInput');
var socket;

var debug = function (args) {
    if (console && console.log) {
        console.log(args);
    }
};

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    global.mobile = true;
}

// Track player's mass milestones for farm coin rewards
var lastMassMilestone = 0;

function startGame(type) {
    global.playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 25);
    global.playerType = type;

    global.screen.width = window.innerWidth;
    global.screen.height = window.innerHeight;

    document.getElementById('startMenuWrapper').style.maxHeight = '0px';
    document.getElementById('gameAreaWrapper').style.opacity = 1;
    if (!socket) {
        socket = io({ query: "type=" + type });
        setupSocket(socket);
    }
    if (!global.animLoopHandle)
        animloop();
    socket.emit('respawn');
    window.chat.socket = socket;
    window.chat.registerFunctions();
    window.canvas.socket = socket;
    global.socket = socket;
    
    // Reset mass milestone tracking when starting a new game
    lastMassMilestone = 0;
}

// Checks if the nick chosen contains valid alphanumeric characters (and underscores).
function validNick() {
    var regex = /^\w*$/;
    debug('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = function () {

    var btn = document.getElementById('startButton'),
        btnS = document.getElementById('spectateButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btnS.onclick = function () {
        startGame('spectator');
    };

    btn.onclick = function () {

        // Checks if the nick is valid.
        if (validNick()) {
            nickErrorText.style.opacity = 0;
            startGame('player');
        } else {
            nickErrorText.style.opacity = 1;
        }
    };

    var settingsMenu = document.getElementById('settingsButton');
    var settings = document.getElementById('settings');

    settingsMenu.onclick = function () {
        if (settings.style.maxHeight == '300px') {
            settings.style.maxHeight = '0px';
        } else {
            settings.style.maxHeight = '300px';
        }
    };

    playerNameInput.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

        if (key === global.KEY_ENTER) {
            if (validNick()) {
                nickErrorText.style.opacity = 0;
                startGame('player');
            } else {
                nickErrorText.style.opacity = 1;
            }
        }
    });
};

// TODO: Break out into GameControls.

var playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

var player = {
    id: -1,
    x: global.screen.width / 2,
    y: global.screen.height / 2,
    screenWidth: global.screen.width,
    screenHeight: global.screen.height,
    target: { x: global.screen.width / 2, y: global.screen.height / 2 }
};
global.player = player;

var foods = [];
var viruses = [];
var fireFood = [];
var users = [];
var leaderboard = [];
var target = { x: player.x, y: player.y };
global.target = target;

window.canvas = new Canvas();
window.chat = new ChatClient();

var visibleBorderSetting = document.getElementById('visBord');
visibleBorderSetting.onchange = settings.toggleBorder;

var showMassSetting = document.getElementById('showMass');
showMassSetting.onchange = settings.toggleMass;

var continuitySetting = document.getElementById('continuity');
continuitySetting.onchange = settings.toggleContinuity;

var roundFoodSetting = document.getElementById('roundFood');
roundFoodSetting.onchange = settings.toggleRoundFood;

var darkModeSetting = document.getElementById('darkMode');
darkModeSetting.onchange = settings.toggleDarkMode;

var c = window.canvas.cv;
var graph = c.getContext('2d');

$("#feed").click(function () {
    socket.emit('1');
    window.canvas.reenviar = false;
});

$("#split").click(function () {
    socket.emit('2');
    window.canvas.reenviar = false;
});

function handleDisconnect() {
    socket.close();
    if (!global.kicked) { // We have a more specific error message 
        render.drawErrorMessage('Disconnected!', graph, global.screen);
    }
}

// Function to check mass milestones and award farm coins
function checkMassMilestones(currentMass) {
    // Calculate the milestone reached (every 100 mass)
    var currentMilestone = Math.floor(currentMass / 100);
    
    // If player reached a new milestone
    if (currentMilestone > lastMassMilestone) {
        // Calculate how many new milestones were reached
        var newMilestones = currentMilestone - lastMassMilestone;
        
        // Update the last milestone
        lastMassMilestone = currentMilestone;
        
        // Award farm coins (10 per milestone)
        var coinsEarned = newMilestones * 10;
        
        // Send message to parent (farm.tsx) to add coins
        if (window.parent) {
            window.parent.postMessage({
                type: 'noot-io',
                action: 'earn-coins',
                coins: coinsEarned
            }, '*');
            
            // Notify player
            window.chat.addSystemLine('You earned ' + coinsEarned + ' Farm Coins for growing larger!');
        }
    }
}

// socket stuff.
function setupSocket(socket) {
    // Handle ping.
    socket.on('pongcheck', function () {
        var latency = Date.now() - global.startPingTime;
        debug('Latency: ' + latency + 'ms');
        window.chat.addSystemLine('Ping: ' + latency + 'ms');
    });

    // Handle error.
    socket.on('connect_error', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // Handle connection.
    socket.on('welcome', function (playerSettings, gameSizes) {
        player = playerSettings;
        player.name = global.playerName;
        player.screenWidth = global.screen.width;
        player.screenHeight = global.screen.height;
        player.target = window.canvas.target;
        global.player = player;
        window.chat.player = player;
        socket.emit('gotit', player);
        global.gameStart = true;
        window.chat.addSystemLine('Connected to the game!');
        window.chat.addSystemLine('Type <b>-help</b> for a list of commands.');
        window.chat.addSystemLine('Earn 10 Farm Coins for every 100 mass!');
        if (global.mobile) {
            document.getElementById('gameAreaWrapper').removeChild(document.getElementById('chatbox'));
        }
        c.focus();
        global.game.width = gameSizes.width;
        global.game.height = gameSizes.height;
        resize();
    });

    socket.on('playerDied', (data) => {
        const player = isUnnamedCell(data.playerEatenName) ? 'An unnamed cell' : data.playerEatenName;
        window.chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten');
        
        // Reset mass milestone tracking if the player died
        if (data.playerEatenId === global.player.id) {
            lastMassMilestone = 0;
        }
    });

    socket.on('playerDisconnect', (data) => {
        window.chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> disconnected.');
    });

    socket.on('playerJoin', (data) => {
        window.chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> joined.');
    });

    socket.on('leaderboard', (data) => {
        leaderboard = data.leaderboard;
        var status = '<span class="title">Leaderboard</span>';
        for (var i = 0; i < leaderboard.length; i++) {
            status += '<br />';
            if (leaderboard[i].id == player.id) {
                if (leaderboard[i].name.length !== 0)
                    status += '<span class="me">' + (i + 1) + '. ' + leaderboard[i].name + "</span>";
                else
                    status += '<span class="me">' + (i + 1) + ". An unnamed cell</span>";
            } else {
                if (leaderboard[i].name.length !== 0)
                    status += (i + 1) + '. ' + leaderboard[i].name;
                else
                    status += (i + 1) + '. An unnamed cell';
            }
        }
        document.getElementById('status').innerHTML = status;
    });

    socket.on('serverMSG', function (data) {
        window.chat.addSystemLine(data);
    });

    // Chat.
    socket.on('serverSendPlayerChat', function (data) {
        window.chat.addChatLine(data.sender, data.message, false);
    });

    // Handle movement.
    socket.on('serverTellPlayerMove', function (playerData, userData, foodsList, massList, virusList) {
        if (global.playerType == 'player') {
            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
            
            // Check if player has reached a new mass milestone to award farm coins
            checkMassMilestones(player.massTotal);
        }
        users = userData;
        foods = foodsList;
        viruses = virusList;
    });

    // Death.
    socket.on('RIP', function () {
        global.gameStart = false;
        global.kicked = true;
        global.died = true;
        
        // Reset mass milestone tracker when player dies
        lastMassMilestone = 0;
        
        window.setTimeout(function () {
            document.getElementById('gameAreaWrapper').style.opacity = 0;
            document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
            global.died = false;
            if (global.animLoopHandle) {
                window.cancelAnimationFrame(global.animLoopHandle);
                global.animLoopHandle = undefined;
            }
        }, 2500);
    });

    socket.on('kick', function (data) {
        global.gameStart = false;
        global.kicked = true;
        
        // Reset mass milestone tracker when player is kicked
        lastMassMilestone = 0;
        
        socket.close();
        render.drawErrorMessage('You were kicked!', graph, global.screen);
        
        window.setTimeout(function () {
            document.getElementById('gameAreaWrapper').style.opacity = 0;
            document.getElementById('startMenuWrapper').style.maxHeight = '1000px';
            global.kicked = false;
            if (global.animLoopHandle) {
                window.cancelAnimationFrame(global.animLoopHandle);
                global.animLoopHandle = undefined;
            }
        }, 2500);
    });
};

const isUnnamedCell = (name) => name.length < 1;

const getPosition = (entity, player, screen) => {
    var x = 0;
    var y = 0;

    let dX = entity.x - player.x;
    let dY = entity.y - player.y;
    
    // Returned value defines the position of the object relative to the center
    x = screen.width/2 + dX;
    y = screen.height/2 + dY;

    return {
        x: x,
        y: y
    };
};

function drawCircle(ctx, centerX, centerY, radius, sides) {
    var theta = 0;
    var x = 0;
    var y = 0;

    ctx.beginPath();

    for (var i = 0; i < sides; i++) {
        theta = (i / sides) * 2 * Math.PI;
        x = centerX + radius * Math.sin(theta);
        y = centerY + radius * Math.cos(theta);
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function valueInRange(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

function animloop() {
    global.animLoopHandle = window.requestAnimationFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (global.died) {
        graph.fillStyle = '#333333';
        graph.fillRect(0, 0, global.screen.width, global.screen.height);

        graph.textAlign = 'center';
        graph.fillStyle = '#FFFFFF';
        graph.font = 'bold 30px sans-serif';
        graph.fillText('You died!', global.screen.width / 2, global.screen.height / 2);
    }
    else if (!global.gameStart) {
        if(window.canvas) {
            graph.fillStyle = '#333333';
            graph.fillRect(0, 0, global.screen.width, global.screen.height);

            graph.textAlign = 'center';
            graph.fillStyle = '#FFFFFF';
            graph.font = 'bold 30px sans-serif';
            if (global.kicked) {
                graph.fillText('You were kicked!', global.screen.width / 2, global.screen.height / 2);
            }
            else {
                graph.fillText('Game Over!', global.screen.width / 2, global.screen.height / 2);
            }
        }
    } else {
        render.renderGame(window.canvas, graph, player, users, foods, viruses, global.screen, global.game);
    }
}

window.addEventListener('resize', resize);

function resize() {
    if (!socket) return;

    player.screenWidth = c.width = global.screen.width = window.innerWidth;
    player.screenHeight = c.height = global.screen.height = window.innerHeight;

    if (socket) {
        socket.emit('windowResized', { screenWidth: global.screen.width, screenHeight: global.screen.height });
    }
}

// Listen for parent window messages (for integration with farm.tsx)
window.addEventListener('message', function(event) {
    // Check if the message is from our parent and has the right format
    if (event.data && event.data.type === 'noot-io-init') {
        // You can use event.data.farmCoins here if needed
        console.log('Received init from parent with farm coins:', event.data.farmCoins);
    }
});

class Settings {
    constructor() {
        this.showBorder = false;
        this.showMass = true;
        this.continuity = false;
        this.roundFood = true; 
        this.darkMode = false;
    }

    toggleBorder(evt) {
        settings.showBorder = evt.target.checked;
    }

    toggleMass(evt) {
        settings.showMass = evt.target.checked;
    }

    toggleContinuity(evt) {
        settings.continuity = evt.target.checked;
    }

    toggleRoundFood(evt) {
        settings.roundFood = evt.target.checked;
    }
    
    toggleDarkMode(evt) {
        settings.darkMode = evt.target.checked;
        render.updateDarkMode(settings.darkMode);
    }
}

var settings = new Settings(); 
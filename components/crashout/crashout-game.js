// Select elements
const playButton = document.getElementById("playButton");
const cashoutButton = document.getElementById("cashoutButton");
const betAmountInput = document.getElementById("betAmount");
const autoCashoutInput = document.getElementById("autoCashout");
const multiplierText = document.getElementById("multiplierText");
const gameResult = document.getElementById("gameResult");
const countdownText = document.getElementById("countdownText");
const countdownOverlay = document.getElementById("countdownOverlay");
const historyContainer = document.getElementById("historyContainer");
const connectionStatusText = document.getElementById("connectionStatus");

// Constants for states
const GAME_STATE = {
    INACTIVE: "inactive",
    COUNTDOWN: "countdown",
    ACTIVE: "active",
    CRASHED: "crashed",
};

// Variables
let multiplier = 1.0;
let gameInterval = null;
let countdown = 10; // Countdown before game starts
let gameState = GAME_STATE.INACTIVE;
let autoCashoutValue = null;
let cashoutTriggered = false;
let gameHistory = [];
let inactivityTimer = null;
let playerJoined = false;
let username = "Player" + Math.floor(Math.random() * 1000);
let isConnected = false;
let pollingInterval = null;
let apiUrl = '/api/game';

// Sound Management
class SoundManager {
    constructor() {
        this.sounds = {
            cashout: this.createAudio('sounds/cashout.mp3'),
            crash: this.createAudio('sounds/crash.mp3'),
            win: this.createAudio('sounds/win.mp3')
        };
        this.enabled = true;
    }

    createAudio(src) {
        const audio = new Audio(src);
        audio.onerror = (e) => {
            console.error('Audio Loading Error:', e);
        };
        return audio;
    }

    play(soundName) {
        if (!this.enabled) return;
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => {
                    console.error('Audio Playback Error:', e);
                });
            }
        } catch (error) {
            console.error('Sound Playback Error:', error);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const soundManager = new SoundManager();

// API Communication Functions
async function fetchGameState() {
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            isConnected = true;
            connectionStatusText.textContent = "Connected";
            connectionStatusText.className = "text-green-500";
            
            updateGameStateFromServer(data);
            return data;
        } else {
            handleConnectionError(data.message || "Unknown server error");
            return null;
        }
    } catch (error) {
        handleConnectionError(error.message);
        return null;
    }
}

function updateGameStateFromServer(data) {
    if (!data || !data.gameState) return;
    
    const serverState = data.gameState;
    
    // Update multiplier
    if (serverState.state === GAME_STATE.ACTIVE && serverState.multiplier) {
        multiplier = parseFloat(serverState.multiplier);
        updateMultiplierDisplay(multiplier);
    }
    
    // Update game state
    if (serverState.state !== gameState) {
        gameState = serverState.state;
        
        // Handle state transitions
        if (gameState === GAME_STATE.COUNTDOWN) {
            countdown = serverState.countdown || 10;
            showCountdown();
        } else if (gameState === GAME_STATE.ACTIVE) {
            hideCountdown();
            playButton.disabled = true;
            cashoutButton.disabled = playerJoined ? false : true;
        } else if (gameState === GAME_STATE.CRASHED) {
            handleCrash(serverState.crashPoint || multiplier);
        } else if (gameState === GAME_STATE.INACTIVE) {
            resetGame();
        }
    }
    
    // Update history if available
    if (data.history && Array.isArray(data.history)) {
        updateHistoryFromServer(data.history);
    }
}

function updateHistoryFromServer(history) {
    gameHistory = history.map(entry => ({
        value: entry.value || entry.crashPoint.toFixed(2),
        color: parseFloat(entry.value || entry.crashPoint) >= 2 ? "green" : "red"
    }));
    
    updateHistoryDisplay();
}

function handleConnectionError(message) {
    console.error('Connection error:', message);
    isConnected = false;
    connectionStatusText.textContent = "Disconnected";
    connectionStatusText.className = "text-red-500";
}

async function placeBet() {
    if (!isConnected) {
        alert("Cannot place bet: Not connected to server");
        return false;
    }
    
    const betAmount = parseFloat(betAmountInput.value);
    if (!betAmount || betAmount <= 0) {
        alert("Please enter a valid bet amount");
        return false;
    }
    
    autoCashoutValue = parseFloat(autoCashoutInput.value) || null;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'placeBet',
                username,
                betAmount,
                autoCashout: autoCashoutValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            playerJoined = true;
            playButton.disabled = true;
            cashoutButton.disabled = false;
            return true;
        } else {
            alert(data.message || "Failed to place bet");
            return false;
        }
    } catch (error) {
        console.error('Error placing bet:', error);
        alert("Network error while placing bet");
        return false;
    }
}

async function cashout() {
    if (!isConnected || !playerJoined || gameState !== GAME_STATE.ACTIVE) {
        alert("Cannot cash out now");
        return false;
    }
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cashout',
                username
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            handleCashoutSuccess(data.multiplier, data.winAmount);
            return true;
        } else {
            alert(data.message || "Failed to cash out");
            return false;
        }
    } catch (error) {
        console.error('Error cashing out:', error);
        alert("Network error while cashing out");
        return false;
    }
}

// Game Functions
function resetGame() {
    multiplier = 1.0;
    updateMultiplierDisplay(multiplier);
    playButton.disabled = false;
    cashoutButton.disabled = true;
    gameResult.textContent = "";
    cashoutTriggered = false;
    gameState = GAME_STATE.INACTIVE;
    playerJoined = false;
    hideCountdown();
    
    // Clear game intervals
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
}

function showCountdown() {
    countdownOverlay.classList.remove("hidden");
    countdownText.textContent = countdown;
    
    // Update countdown every second
    gameInterval = setInterval(() => {
        countdown--;
        countdownText.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(gameInterval);
            gameInterval = null;
            hideCountdown();
        }
    }, 1000);
}

function hideCountdown() {
    countdownOverlay.classList.add("hidden");
}

function handleCashoutSuccess(cashoutMultiplier, winAmount) {
    playButton.disabled = false;
    cashoutButton.disabled = true;
    playerJoined = false;
    
    soundManager.play('cashout');
    
    gameResult.textContent = `You cashed out at ${cashoutMultiplier.toFixed(2)}x! Won $${winAmount.toFixed(2)}`;
    gameResult.style.color = "#0f0";
    
    // Add to history
    updateHistory(cashoutMultiplier.toFixed(2), "green");
}

function handleCrash(crashPoint) {
    clearInterval(gameInterval);
    gameInterval = null;
    
    if (playerJoined) {
        gameResult.textContent = "Game Crashed!";
        gameResult.style.color = "#f00";
        soundManager.play('crash');
        playerJoined = false;
    }
    
    multiplier = crashPoint;
    updateMultiplierDisplay(multiplier);
    multiplierText.style.color = "#f00";
    
    updateHistory(crashPoint.toFixed(2), "red");
    
    // Re-enable play button after crash
    setTimeout(() => {
        playButton.disabled = false;
    }, 1000);
}

function updateMultiplierDisplay(value) {
    if (!multiplierText) return;
    
    multiplierText.textContent = `${value.toFixed(2)}x`;
    
    // Change color based on value
    if (gameState === GAME_STATE.CRASHED) {
        multiplierText.style.color = "#f00"; // Red for crash
    } else if (value >= 2.0) {
        multiplierText.style.color = "#0f0"; // Green for good values
    } else {
        multiplierText.style.color = "#fff"; // White for normal values
    }
}

function updateHistory(value, color) {
    gameHistory.unshift({ value, color });
    if (gameHistory.length > 5) gameHistory.pop();
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    historyContainer.innerHTML = "";
    
    gameHistory.forEach(entry => {
        const historyItem = document.createElement("div");
        historyItem.className = "p-2 rounded text-center mx-1";
        historyItem.style.backgroundColor = entry.color === "green" ? "#0f0" : "#f00";
        historyItem.style.color = "#000";
        historyItem.textContent = `${entry.value}x`;
        historyContainer.appendChild(historyItem);
    });
}

// Setup polling for game state
function setupPolling() {
    console.log("Setting up server polling");
    
    // Initial fetch
    fetchGameState();
    
    // Clear existing polling
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Set up new polling
    pollingInterval = setInterval(fetchGameState, 3000);
}

// Event Listeners
if (playButton) {
    playButton.addEventListener("click", placeBet);
}

if (cashoutButton) {
    cashoutButton.addEventListener("click", cashout);
}

// Initialize on load
window.addEventListener('load', () => {
    resetGame();
    setupPolling();
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    if (gameInterval) {
        clearInterval(gameInterval);
    }
}); 
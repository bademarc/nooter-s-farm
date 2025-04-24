// Noot.io - A simplified version of the Agar.io game
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io();
let player = {};
let players = [];
let foods = [];
let leaderboard = [];
let mouseX = 0;
let mouseY = 0;
const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

// Set canvas to full container size
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Track mouse position
canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Socket.io event handlers
socket.on('initGame', function(data) {
  player = data.player;
  players = data.players;
  foods = data.foods;
});

socket.on('update', function(data) {
  players = data.players;
  foods = data.foods;
  leaderboard = data.leaderboard;
});

// Game rendering functions
function drawCircle(x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawText(text, x, y, color, size) {
  ctx.font = `${size}px Arial`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawPlayer(p) {
  drawCircle(p.x, p.y, p.mass, p.color || '#FFFFFF');
  if (p.name) {
    drawText(p.name, p.x, p.y, '#FFFFFF', 14);
  }
}

function drawFood(food) {
  drawCircle(food.x, food.y, 5, food.color || '#8BC34A');
}

function drawLeaderboard() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(canvas.width - 170, 10, 160, 20 + leaderboard.length * 20);
  drawText('Leaderboard', canvas.width - 90, 25, '#FFFFFF', 16);
  
  leaderboard.forEach((player, i) => {
    drawText(`${i+1}. ${player.name || 'Anonymous'}: ${player.mass}`, canvas.width - 90, 45 + i * 20, '#FFFFFF', 14);
  });
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate center position for camera
  let cameraX = player.x || canvas.width / 2;
  let cameraY = player.y || canvas.height / 2;
  
  // Draw food
  foods.forEach(food => {
    drawFood({
      x: food.x - cameraX + canvas.width / 2,
      y: food.y - cameraY + canvas.height / 2,
      color: food.color
    });
  });
  
  // Draw other players
  players.forEach(p => {
    if (p.id !== player.id) {
      drawPlayer({
        x: p.x - cameraX + canvas.width / 2,
        y: p.y - cameraY + canvas.height / 2,
        mass: p.mass,
        name: p.name,
        color: p.color
      });
    }
  });
  
  // Draw current player
  if (player.x && player.y) {
    drawPlayer({
      x: canvas.width / 2,
      y: canvas.height / 2,
      mass: player.mass,
      name: player.name,
      color: player.color
    });
  }
  
  // Draw leaderboard
  if (leaderboard.length > 0) {
    drawLeaderboard();
  }
  
  // Send mouse position to server
  socket.emit('mouseMove', {
    mouseX: mouseX - canvas.width / 2 + player.x,
    mouseY: mouseY - canvas.height / 2 + player.y
  });
  
  requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
  const nickname = document.getElementById('nickname').value || 'Nooter';
  socket.emit('joinGame', { nickname });
  document.getElementById('start-menu').style.display = 'none';
  document.getElementById('game-canvas').style.display = 'block';
  gameLoop();
}

// Initialize menu button
document.getElementById('start-button').addEventListener('click', startGame); 
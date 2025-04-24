var global = require('./global');

// Custom Noot.io theme colors
const nootTheme = {
    background: '#111111',
    food: '#00BCD4',
    gridLines: '#333333', 
    border: '#00BCD4',
    text: '#FFFFFF',
    darkMode: {
        background: '#000000',
        gridLines: '#222222'
    }
};

// Track dark mode state
let isDarkMode = false;

// Update theme based on dark mode
function updateDarkMode(enabled) {
    isDarkMode = enabled;
}

function drawCircle(centerX, centerY, radius, sides, ctx) {
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

function drawFood(food, ctx, size) {
    ctx.strokeStyle = nootTheme.food;
    ctx.fillStyle = nootTheme.food;
    if (size == null) size = food.radius;
    drawCircle(food.x, food.y, size, global.settings?.roundFood ? 50 : 5, ctx);
}

function drawVirus(virus, ctx) {
    ctx.strokeStyle = '#33ff33';
    ctx.fillStyle = '#33ff33';
    drawCircle(virus.x, virus.y, virus.radius, global.settings?.roundFood ? 50 : 18, ctx);
}

function drawGrid(ctx, width, height, screen) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDarkMode ? nootTheme.darkMode.gridLines : nootTheme.gridLines;
    ctx.globalAlpha = 0.15;
    
    // Draw vertical lines
    for (var x = -screen.width - width; x < 2 * screen.width + width; x += 50) {
        if (x >= -width && x <= width) {
            ctx.moveTo(x, -height);
            ctx.lineTo(x, height);
        }
    }
    
    // Draw horizontal lines
    for (var y = -screen.height - height; y < 2 * screen.height + height; y += 50) {
        if (y >= -height && y <= height) {
            ctx.moveTo(-width, y);
            ctx.lineTo(width, y);
        }
    }
    
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawBorders(ctx, width, height, game) {
    if (!global.settings.showBorder) return;
    
    ctx.lineWidth = 5;
    ctx.strokeStyle = nootTheme.border;
    
    // Draw border
    ctx.beginPath();
    ctx.moveTo(-width, -height);
    ctx.lineTo(width, -height);
    ctx.lineTo(width, height);
    ctx.lineTo(-width, height);
    ctx.lineTo(-width, -height);
    ctx.stroke();
}

function drawPlayers(players, ctx, player, zoom) {
    players.forEach(function (currentPlayer) {
        // Don't draw if invisible
        if (currentPlayer.id === player.id) return;
        
        var x = currentPlayer.x - player.x + global.screen.width / 2;
        var y = currentPlayer.y - player.y + global.screen.height / 2;
        
        // Draw cells
        for (var i = 0; i < currentPlayer.cells.length; i++) {
            var cell = currentPlayer.cells[i];
            var radius = cell.radius;
            
            drawPlayerCell(x + cell.x, y + cell.y, radius, currentPlayer.hue, cell.index, ctx);
        }
    });
}

function drawPlayerCells(player, ctx) {
    for (var i = 0; i < player.cells.length; i++) {
        var cell = player.cells[i];
        
        drawPlayerCell(
            global.screen.width / 2 + cell.x,
            global.screen.height / 2 + cell.y,
            cell.radius,
            player.hue,
            cell.index,
            ctx
        );
    }
}

function drawPlayerCell(x, y, radius, hue, index, ctx) {
    // Draw cell body
    ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    ctx.strokeStyle = 'hsl(' + hue + ', 100%, 45%)';
    ctx.lineWidth = 6;
    drawCircle(x, y, radius, 50, ctx);
    
    // Draw cell index if mass is enabled
    if (global.settings?.showMass) {
        drawCellMass(x, y, radius, index, ctx);
    }
}

function drawCellMass(x, y, radius, index, ctx) {
    ctx.lineWidth = 2;
    ctx.fillStyle = nootTheme.text;
    ctx.strokeStyle = '#000000';
    
    // Draw text based on radius size
    var fontSize = Math.max(radius / 3, 12);
    ctx.font = 'bold ' + fontSize + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Outline the text
    ctx.strokeText(index, x, y);
    ctx.fillText(index, x, y);
}

function renderGame(canvas, ctx, player, users, foods, viruses, screen, game) {
    // Set background color
    ctx.fillStyle = isDarkMode ? nootTheme.darkMode.background : nootTheme.background;
    ctx.fillRect(0, 0, screen.width, screen.height);
    
    // Move the canvas to center on the player
    ctx.save();
    ctx.translate(screen.width / 2, screen.height / 2);
    
    // Draw grid
    drawGrid(ctx, game.width, game.height, screen);
    
    // Draw borders
    drawBorders(ctx, game.width, game.height, game);
    
    // Sort the players so smaller cells are drawn on top of larger ones
    let sortedUsers = [...users];
    sortedUsers.sort((a, b) => {
        return b.mass - a.mass;
    });
    
    // Draw all the food
    foods.forEach(food => drawFood(food, ctx));
    
    // Draw all the viruses
    viruses.forEach(virus => drawVirus(virus, ctx));
    
    // Draw all the players
    drawPlayers(sortedUsers, ctx, player);
    
    // Draw the player's cells
    drawPlayerCells(player, ctx);
    
    ctx.restore();
}

function drawErrorMessage(message, ctx, screen) {
    ctx.fillStyle = nootTheme.background;
    ctx.fillRect(0, 0, screen.width, screen.height);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(message, screen.width / 2, screen.height / 2);
}

module.exports = {
    renderGame: renderGame,
    drawCircle: drawCircle,
    drawErrorMessage: drawErrorMessage,
    updateDarkMode: updateDarkMode
}; 
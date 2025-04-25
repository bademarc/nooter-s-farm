const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
  // Basic HTTP response for health checks or info
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Noot.io Backend Server Running\n');
});

const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from any origin (adjust for production later!)
    methods: ["GET", "POST"]
  }
});

console.log('Socket.IO server initialized');

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    // TODO: Handle player disconnection (remove from game state)
  });

  // TODO: Add game-specific event listeners (player movement, actions, etc.)
  socket.on('player_update', (data) => {
    // Example: Broadcast player data to others (excluding sender)
    // socket.broadcast.emit('player_moved', { id: socket.id, ...data });
    console.log('Received player_update from', socket.id, ":", data);
  });

});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

// Simplified queue for matching
let waitingQueue = [];
// Map to track active matches: socketId -> partnerId
const activeMatches = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('find-partner', () => {
    // Prevent double matching
    if (activeMatches.has(socket.id)) return;

    // Remove from queue if already there
    waitingQueue = waitingQueue.filter(id => id !== socket.id);

    if (waitingQueue.length > 0) {
      const partnerId = waitingQueue.shift();
      
      // Create a match
      activeMatches.set(socket.id, partnerId);
      activeMatches.set(partnerId, socket.id);

      // Notify both
      io.to(socket.id).emit('partner-found', { partnerId, initiator: true });
      io.to(partnerId).emit('partner-found', { partnerId: socket.id, initiator: false });
      
      console.log(`Matched ${socket.id} with ${partnerId}`);
    } else {
      waitingQueue.push(socket.id);
      console.log(`${socket.id} is waiting for a partner...`);
    }
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  socket.on('chat-message', ({ to, text }) => {
    io.to(to).emit('chat-message', text);
  });

  socket.on('leave-chat', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleDisconnect(socket);
  });

  function handleDisconnect(socket) {
    // Remove from queue
    waitingQueue = waitingQueue.filter(id => id !== socket.id);

    // Notify partner if matched
    const partnerId = activeMatches.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-left');
      activeMatches.delete(partnerId);
      activeMatches.delete(socket.id);
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

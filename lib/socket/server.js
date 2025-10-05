const { Server: SocketIOServer } = require('socket.io');
const { connectToDatabase } = require('../db/connection');
const { Room } = require('../db/models');

class SocketServer {
  constructor() {
    this.io = null;
  }

  async initialize(httpServer) {
    // Connect to database
    await connectToDatabase();

    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Handle socket connections
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle room joining
      socket.on('join-room', async (data) => {
        try {
          const { roomId, userId } = data;
          
          // Validate room exists in database (except for public room)
          if (roomId !== 'PUBLIC123') {
            const room = await Room.findOne({ key: roomId });
            if (!room) {
              socket.emit('room-error', { message: 'Invalid room key' });
              return;
            }
            
            // Check if room has expired
            if (room.expiresAt < new Date()) {
              socket.emit('room-error', { message: 'Room has expired' });
              return;
            }
          }
          
          // Join the room
          socket.join(roomId);
          
          // Notify others in the room about new user
          socket.to(roomId).emit('user-joined', { userId, roomId });
          
          // Confirm room joined
          socket.emit('room-joined', { roomId, userId });
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('room-error', { message: 'Failed to join room' });
        }
      });

      // Handle room leaving
      socket.on('leave-room', (data) => {
        const { roomId, userId } = data;
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', { userId, roomId });
      });

      // Handle WebRTC signaling
      socket.on('offer', (data) => {
        const { roomId, offer, senderId } = data;
        // Send offer to all other users in the room except the sender
        socket.to(roomId).emit('offer', { offer, senderId });
      });

      socket.on('answer', (data) => {
        const { roomId, answer, senderId } = data;
        // Send answer to all other users in the room except the sender
        socket.to(roomId).emit('answer', { answer, senderId });
      });

      socket.on('ice-candidate', (data) => {
        const { roomId, candidate, senderId } = data;
        // Send ICE candidate to all other users in the room except the sender
        socket.to(roomId).emit('ice-candidate', { candidate, senderId });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    console.log('Socket.IO server initialized');
  }

  getIO() {
    return this.io;
  }
}

module.exports = { SocketServer };
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { connectToDatabase } from "@/lib/db/connection";
import { Room } from "@/lib/db/models";

export type SocketServer = NetServer & {
  io?: ServerIO;
};

export const initSocketIO = (httpServer: NetServer) => {
  if (!httpServer.io) {
    console.log("Initializing Socket.IO server...");
    
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      socket.on("join-room", async (data) => {
        try {
          // Connect to database
          await connectToDatabase();
          
          const { roomId, userId } = data;
          
          // Validate room exists
          const room = await Room.findOne({ key: roomId });
          
          if (!room) {
            socket.emit("room-error", { message: "Invalid room key" });
            return;
          }
          
          // Check if room has expired
          if (room.expiresAt < new Date()) {
            socket.emit("room-error", { message: "Room has expired" });
            return;
          }
          
          // Join the room
          socket.join(roomId);
          
          // Notify others in the room
          socket.to(roomId).emit("user-joined", { userId, roomId });
          
          // Send success response
          socket.emit("room-joined", { roomId, userId });
        } catch (error) {
          console.error("Socket join-room error:", error);
          socket.emit("room-error", { message: "Failed to join room" });
        }
      });
      
      socket.on("leave-room", (data) => {
        const { roomId, userId } = data;
        socket.leave(roomId);
        socket.to(roomId).emit("user-left", { userId, roomId });
      });
      
      socket.on("offer", (data) => {
        const { roomId, offer, senderId } = data;
        socket.to(roomId).emit("offer", { offer, senderId });
      });
      
      socket.on("answer", (data) => {
        const { roomId, answer, senderId } = data;
        socket.to(roomId).emit("answer", { answer, senderId });
      });
      
      socket.on("ice-candidate", (data) => {
        const { roomId, candidate, senderId } = data;
        socket.to(roomId).emit("ice-candidate", { candidate, senderId });
      });
      
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
    
    httpServer.io = io;
    console.log("Socket.IO server initialized");
  }
  
  return httpServer.io;
};
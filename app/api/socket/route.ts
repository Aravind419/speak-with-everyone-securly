import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Room } from "@/lib/db/models";

// This is a REST API implementation for room management
export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ message: "Room management API" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    const body = await request.json();

    // Handle different socket events
    switch (body.type) {
      case "create-room":
        // Generate a unique room key
        const roomKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Save room to database
        const newRoom = new Room({
          key: roomKey
        });
        
        await newRoom.save();
        
        return new Response(
          JSON.stringify({
            success: true,
            roomId: roomKey,
          }),
          { status: 201 }
        );

      case "validate-room":
        // Public rooms don't need validation
        if (body.roomId === "PUBLIC123") {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Public room is valid"
            })
          );
        }
        
        // Check if private room exists in database
        const room = await Room.findOne({ key: body.roomId });
        
        if (!room) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid room key"
            }),
            { status: 404 }
          );
        }
        
        // Check if room has expired
        if (room.expiresAt < new Date()) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Room has expired"
            }),
            { status: 410 }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Room is valid"
          })
        );

      case "join-room":
        // Public rooms don't need validation
        if (body.roomId === "PUBLIC123") {
          return new Response(
            JSON.stringify({
              success: true,
              roomId: body.roomId,
              users: [],
            }),
          );
        }
        
        // Validate private room before joining
        const roomToJoin = await Room.findOne({ key: body.roomId });
        
        if (!roomToJoin) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid room key"
            }),
            { status: 404 }
          );
        }
        
        // Check if room has expired
        if (roomToJoin.expiresAt < new Date()) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Room has expired"
            }),
            { status: 410 }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            roomId: body.roomId,
            users: [],
          }),
        );

      case "speak-request":
        return new Response(
          JSON.stringify({
            success: true,
            message: "Speak request sent",
          }),
        );

      default:
        return new Response(JSON.stringify({ error: "Unknown event type" }), {
          status: 400,
        });
    }
  } catch (error) {
    console.error("Socket API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
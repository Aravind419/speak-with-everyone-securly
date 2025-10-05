import { connectToDatabase } from '../lib/db/connection';
import { Room } from '../lib/db/models';
import mongoose from 'mongoose';

describe('MongoDB Integration Tests', () => {
  beforeAll(async () => {
    // Connect to the database
    await connectToDatabase();
  });

  afterAll(async () => {
    // Clean up and close database connection
    await Room.deleteMany({});
    await mongoose.connection.close();
  });

  test('should create and validate a room', async () => {
    // Generate a test room key
    const roomKey = 'TEST123';
    
    // Create a new room
    const newRoom = new Room({
      key: roomKey
    });
    
    // Save the room
    const savedRoom = await newRoom.save();
    
    // Verify the room was saved
    expect(savedRoom.key).toBe(roomKey);
    expect(savedRoom.createdAt).toBeDefined();
    expect(savedRoom.expiresAt).toBeDefined();
    
    // Validate the room exists
    const foundRoom = await Room.findOne({ key: roomKey });
    expect(foundRoom).toBeDefined();
    expect(foundRoom?.key).toBe(roomKey);
  });

  test('should fail to find non-existent room', async () => {
    // Try to find a room that doesn't exist
    const foundRoom = await Room.findOne({ key: 'NONEXISTENT' });
    expect(foundRoom).toBeNull();
  });

  test('should handle room expiration', async () => {
    // Create a room that expires immediately
    const roomKey = 'EXPIRED';
    const expiredRoom = new Room({
      key: roomKey,
      expiresAt: new Date(Date.now() - 1000) // 1 second ago
    });
    
    await expiredRoom.save();
    
    // Try to find the expired room
    const foundRoom = await Room.findOne({ key: roomKey });
    expect(foundRoom).toBeDefined(); // It exists in DB but is expired
    
    // In a real application, MongoDB's TTL index would remove it
    // But for testing purposes, we can check the expiration logic
    expect(foundRoom?.expiresAt.getTime()).toBeLessThan(Date.now());
  });
});
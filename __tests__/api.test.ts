import { NextRequest } from 'next/server';

// Mock the database functions
jest.mock('@/lib/db/connection', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}));

// Define mock functions first
const mockRoomSave = jest.fn();
const mockRoomFindOne = jest.fn();

// Create a mock Room class
const createMockRoom = () => {
  const MockRoom: any = jest.fn().mockImplementation(() => ({
    save: mockRoomSave,
  }));
  
  // Add static methods
  MockRoom.findOne = mockRoomFindOne;
  return MockRoom;
};

// Mock the Room model
jest.mock('@/lib/db/models', () => ({
  Room: createMockRoom(),
}));

import { GET, POST } from '../app/api/socket/route';

describe('API Socket Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET request should return Room management API message', async () => {
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'GET',
    });
    
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toBe('Room management API');
  });

  test('POST request with create-room should generate room key', async () => {
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'POST',
      body: JSON.stringify({ type: 'create-room' }),
    });
    
    // Mock Room model save function
    mockRoomSave.mockResolvedValue({});
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.roomId).toBeDefined();
    expect(data.roomId).toHaveLength(6);
  });

  test('POST request with validate-room should validate existing room', async () => {
    const roomKey = 'VALID1';
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'POST',
      body: JSON.stringify({ type: 'validate-room', roomId: roomKey }),
    });
    
    // Mock Room.findOne to return a valid room
    mockRoomFindOne.mockResolvedValue({
      key: roomKey,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Room is valid');
  });

  test('POST request with validate-room should reject expired room', async () => {
    const roomKey = 'EXPIRED1';
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'POST',
      body: JSON.stringify({ type: 'validate-room', roomId: roomKey }),
    });
    
    // Mock Room.findOne to return an expired room
    mockRoomFindOne.mockResolvedValue({
      key: roomKey,
      expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(410); // Gone
    expect(data.success).toBe(false);
    expect(data.message).toBe('Room has expired');
  });

  test('POST request with validate-room should reject non-existent room', async () => {
    const roomKey = 'INVALID1';
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'POST',
      body: JSON.stringify({ type: 'validate-room', roomId: roomKey }),
    });
    
    // Mock Room.findOne to return null (room not found)
    mockRoomFindOne.mockResolvedValue(null);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid room key');
  });

  test('POST request with unknown type should return error', async () => {
    const request = new NextRequest('http://localhost:3000/api/socket', {
      method: 'POST',
      body: JSON.stringify({ type: 'unknown-type' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Unknown event type');
  });
});
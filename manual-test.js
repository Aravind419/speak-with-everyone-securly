// Manual test script to verify core functionality
// Run with: node manual-test.js

const { connectToDatabase } = require('./lib/db/connection');
const { Room } = require('./lib/db/models');

async function runTests() {
  console.log('Starting manual tests...');
  
  try {
    // Test 1: Database connection
    console.log('Test 1: Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connection successful');
    
    // Test 2: Create a room
    console.log('Test 2: Creating a test room...');
    const testRoomKey = 'TEST123';
    const newRoom = new Room({
      key: testRoomKey
    });
    
    await newRoom.save();
    console.log('✅ Room creation successful');
    
    // Test 3: Find the room
    console.log('Test 3: Finding the test room...');
    const foundRoom = await Room.findOne({ key: testRoomKey });
    if (foundRoom && foundRoom.key === testRoomKey) {
      console.log('✅ Room find successful');
    } else {
      console.log('❌ Room find failed');
    }
    
    // Test 4: Delete the room
    console.log('Test 4: Cleaning up test room...');
    await Room.deleteOne({ key: testRoomKey });
    console.log('✅ Cleanup successful');
    
    console.log('All manual tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

runTests();
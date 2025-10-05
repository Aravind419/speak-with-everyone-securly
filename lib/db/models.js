const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
});

// Create index for automatic cleanup of expired rooms
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

module.exports = { Room };
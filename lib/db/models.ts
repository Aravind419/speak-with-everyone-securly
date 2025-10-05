import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  key: string;
  createdAt: Date;
  expiresAt: Date;
}

const RoomSchema: Schema = new Schema({
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

export const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
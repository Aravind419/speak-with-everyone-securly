# Speak with Anyone Secretly

A secure, anonymous communication platform built with Next.js, MongoDB, and Socket.IO.

## Features

- Generate and join private rooms with secret keys
- Secure room validation using MongoDB
- Real-time communication with Socket.IO
- Audio and video calling capabilities
- Public and private room options

## Setup Instructions

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://Aravind:Aravind%402041@cluster0.ykz5b.mongodb.net/speak-with-anyone-secretely
   ```

3. Generate SSL certificates for HTTPS (required for audio/video):
   ```bash
   pnpm generate-cert
   ```

4. Run the development server:
   ```bash
   # For HTTP (local development only)
   pnpm dev
   
   # For HTTPS (required for audio/video functionality)
   pnpm dev:https
   
   # For faster development with Turbopack
   pnpm dev:turbo
   ```

5. Open [https://localhost:3000](https://localhost:3000) in your browser (accept the self-signed certificate)

## Build Optimization

This project includes build cache optimizations for faster builds:

```bash
# Production build with caching
pnpm build

# Production build with experimental cache features
pnpm build:cache

# Production build with Turbopack
pnpm build:turbo
```

See [CACHE_OPTIMIZATION.md](CACHE_OPTIMIZATION.md) for detailed information.

## Implementation Details

### MongoDB Integration
- Rooms are stored in MongoDB with automatic expiration (24 hours)
- Secret keys are validated against the database before joining rooms
- Connection pooling for efficient database access

### Socket.IO Implementation
- Real-time communication between users
- Room-based messaging system
- WebRTC signaling for audio/video calls
- Custom Socket.IO server implementation with proper room management

### Security Features
- Secret keys are randomly generated and stored securely
- Room expiration prevents unauthorized access
- Private rooms require valid keys to join

## Audio/Video Implementation

The application now has a working WebRTC implementation for both audio and video calls:

- Proper WebRTC signaling with offer/answer exchange
- ICE candidate handling for NAT traversal
- Media stream management for both local and remote streams
- Connection state monitoring for debugging

**Note**: Audio/video functionality requires HTTPS in modern browsers due to security restrictions on media device access.

## Known Issues

1. **WebRTC Implementation**:
   - Current implementation works for basic audio/video calls
   - Signaling server needs additional work for production use with multiple participants

2. **UI/UX Improvements**:
   - Loading states could be more user-friendly
   - Error handling could be more comprehensive
   - Mobile responsiveness needs testing

## Future Improvements

- Implement full WebRTC peer-to-peer communication with multiple participants
- Add end-to-end encryption for messages
- Implement user authentication and profiles
- Add chat functionality alongside audio/video calls
- Improve UI/UX with better loading states and error handling
- Add recording capabilities for calls
- Implement moderation features for public rooms

## Dependencies

- Next.js 15
- MongoDB with Mongoose
- Socket.IO
- Tailwind CSS
- Radix UI components
- TypeScript

## License

MIT
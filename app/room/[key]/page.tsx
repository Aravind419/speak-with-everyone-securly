"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, Video, PhoneOff, VideoOff, Mic, MicOff, Users, ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useSocket from "@/hooks/useSocket"

interface User {
  id: string
  name: string
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

interface SpeakRequest {
  userId: string
  userName: string
  timestamp: number
}

interface RoomJoinedData {
  roomId: string
  userId: string
}

interface RoomErrorData {
  message: string
}

interface UserJoinedData {
  userId: string
  roomId: string
}

interface UserLeftData {
  userId: string
  roomId: string
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { socket, isConnected } = useSocket()

  const roomKey = params.key as string
  const roomType = searchParams.get("type") as "private" | "public"

  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [speakRequests, setSpeakRequests] = useState<SpeakRequest[]>([])
  const [showSpeakRequest, setShowSpeakRequest] = useState<SpeakRequest | null>(null)
  const [hasRequestedSpeak, setHasRequestedSpeak] = useState(false)
  const [isValidRoom, setIsValidRoom] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Generate a random user ID
  useEffect(() => {
    setUserId(Math.random().toString(36).substring(2, 10))
  }, [])

  // Validate room on component mount
  useEffect(() => {
    const validateRoom = async () => {
      try {
        // Public rooms don't need validation
        if (roomKey === "PUBLIC123") {
          setIsValidRoom(true);
          setIsLoading(false);
          return;
        }

        // Validate private room key with API
        const response = await fetch("/api/socket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            type: "validate-room",
            roomId: roomKey
          }),
        })
        
        const data = await response.json()
        
        if (!data.success) {
          setIsValidRoom(false)
          toast({
            title: "Invalid Room",
            description: data.message || "This room is invalid or has expired.",
            variant: "destructive",
          })
          // Redirect to home after a delay
          setTimeout(() => {
            router.push("/")
          }, 3000)
        } else {
          setIsValidRoom(true)
        }
      } catch (error) {
        setIsValidRoom(false)
        toast({
          title: "Error",
          description: "Failed to validate room. Please try again.",
          variant: "destructive",
        })
        // Redirect to home after a delay
        setTimeout(() => {
          router.push("/")
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }

    validateRoom()
  }, [roomKey, roomType, router, toast])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isValidRoom || isLoading) return

    // Join room
    socket.emit("join-room", { roomId: roomKey, userId })

    // Handle room joined
    const handleRoomJoined = (data: RoomJoinedData) => {
      console.log("Room joined:", data)
      toast({
        title: "Connected",
        description: "You have joined the room successfully.",
      })
    }

    // Handle room error
    const handleRoomError = (data: RoomErrorData) => {
      toast({
        title: "Room Error",
        description: data.message,
        variant: "destructive",
      })
      router.push("/")
    }

    // Handle user joined
    const handleUserJoined = (data: UserJoinedData) => {
      console.log("User joined:", data)
      toast({
        title: "User Joined",
        description: "A new user has joined the room.",
      })
    }

    // Handle user left
    const handleUserLeft = (data: UserLeftData) => {
      console.log("User left:", data)
      toast({
        title: "User Left",
        description: "A user has left the room.",
      })
    }

    socket.on("room-joined", handleRoomJoined)
    socket.on("room-error", handleRoomError)
    socket.on("user-joined", handleUserJoined)
    socket.on("user-left", handleUserLeft)

    // Cleanup
    return () => {
      socket.off("room-joined", handleRoomJoined)
      socket.off("room-error", handleRoomError)
      socket.off("user-joined", handleUserJoined)
      socket.off("user-left", handleUserLeft)
      
      // Leave room
      if (roomKey && userId) {
        socket.emit("leave-room", { roomId: roomKey, userId })
      }
    }
  }, [socket, isValidRoom, isLoading, roomKey, userId, router, toast])

  // WebRTC signaling event handlers
  useEffect(() => {
    if (!socket) return

    // Handle WebRTC offer
    const handleOffer = async (data: any) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
          const answer = await peerConnectionRef.current.createAnswer()
          await peerConnectionRef.current.setLocalDescription(answer)
          
          socket.emit('answer', {
            roomId: roomKey,
            answer: peerConnectionRef.current.localDescription,
            senderId: userId
          })
        }
      } catch (error) {
        console.error('Error handling offer:', error)
      }
    }

    // Handle WebRTC answer
    const handleAnswer = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.answer) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        }
      } catch (error) {
        console.error('Error handling answer:', error)
      }
    }

    // Handle ICE candidate
    const handleIceCandidate = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    // Cleanup
    return () => {
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [socket, roomKey, userId])

  const createOffer = async () => {
    try {
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer()
        await peerConnectionRef.current.setLocalDescription(offer)
        
        if (socket) {
          socket.emit('offer', {
            roomId: roomKey,
            offer: peerConnectionRef.current.localDescription,
            senderId: userId
          })
        }
      }
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  useEffect(() => {
    // Only initialize users if room is valid
    if (!isLoading && isValidRoom) {
      // For real WebRTC implementation, we don't need mock users
      // The actual users will be handled through WebRTC signaling
      const mockUsers: User[] = [
        { id: "1", name: "You", isAudioEnabled: true, isVideoEnabled: true },
        { id: "2", name: "User_A4B2", isAudioEnabled: true, isVideoEnabled: false },
        { id: "3", name: "Anonymous_1", isAudioEnabled: false, isVideoEnabled: true },
      ];

      if (roomType === "public") {
        setConnectedUsers(mockUsers);
      } else {
        setConnectedUsers([mockUsers[0], mockUsers[1]]);
      }
    }
  }, [isLoading, isValidRoom, roomType])

  const startCall = async (type: "audio" | "video") => {
    try {
      const constraints = {
        audio: true,
        video: type === "video",
      };

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Set local video stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC connection
      await initializeWebRTC(stream, type);

      // Create offer after a short delay to allow connection setup
      setTimeout(() => {
        createOffer();
      }, 1000);

      setCallType(type);

      toast({
        title: "Connected!",
        description: `${type === "video" ? "Video" : "Audio"} call started successfully.`,
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Connection Failed",
        description: "Could not access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const initializeWebRTC = async (stream: MediaStream, type: "audio" | "video") => {
    try {
      // Create RTCPeerConnection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            roomId: roomKey,
            candidate: event.candidate,
            senderId: userId
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      // Store the peer connection in a ref for later use
      peerConnectionRef.current = peerConnection;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize WebRTC connection.",
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setCallType(null);
    router.push("/");
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const requestToSpeak = () => {
    if (roomType === "public" && !hasRequestedSpeak) {
      const request: SpeakRequest = {
        userId: "current-user",
        userName: "You",
        timestamp: Date.now(),
      }

      // Simulate sending request to other users
      setTimeout(() => {
        setShowSpeakRequest({
          userId: "user-123",
          userName: "Anonymous_User",
          timestamp: Date.now(),
        })
      }, 2000)

      setHasRequestedSpeak(true)
      toast({
        title: "Speak Request Sent",
        description: "Waiting for others to approve your request.",
      })
    }
  }

  const handleSpeakRequest = (approved: boolean) => {
    if (showSpeakRequest) {
      if (approved) {
        toast({
          title: "Speak Request Approved",
          description: `${showSpeakRequest.userName} can now speak.`,
        })
      } else {
        toast({
          title: "Speak Request Denied",
          description: `${showSpeakRequest.userName}'s request was denied.`,
        })
      }
      setShowSpeakRequest(null)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating room...</p>
        </div>
      </div>
    )
  }

  // Show error if room is invalid
  if (!isValidRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" suppressHydrationWarning>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Room</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              This room is invalid or has expired. You will be redirected to the home page.
            </p>
            <Button onClick={() => router.push("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!callType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" suppressHydrationWarning>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Room: {roomKey}
                  <Badge variant={roomType === "public" ? "secondary" : "default"}>{roomType}</Badge>
                </CardTitle>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {isConnected ? 'Connected' : 'Disconnected'}
                  {roomType === "public" && (
                    <>
                      <Users className="h-4 w-4 ml-2" />
                      {connectedUsers.length} users connected
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">How do you want to talk?</p>
              <div className="flex gap-3">
                <Button onClick={() => startCall("audio")} className="flex-1" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Audio
                </Button>
                <Button onClick={() => startCall("video")} className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </div>
            </div>

            {roomType === "public" && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Connected Users</h3>
                <div className="space-y-2">
                  {connectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <span>{user.name}</span>
                      <div className="flex gap-1">
                        {user.isAudioEnabled ? (
                          <Volume2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <VolumeX className="h-3 w-3 text-gray-400" />
                        )}
                        {user.isVideoEnabled ? (
                          <Video className="h-3 w-3 text-green-600" />
                        ) : (
                          <VideoOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={endCall} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-medium">Room: {roomKey}</h1>
            <p className="text-sm text-gray-400">
              {callType === "video" ? "Video Call" : "Audio Call"} • {connectedUsers.length} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          
          {roomType === "public" && (
            <Button onClick={requestToSpeak} disabled={hasRequestedSpeak} variant="outline" size="sm" className="ml-4">
              <Mic className="h-4 w-4 mr-2" />
              {hasRequestedSpeak ? "Request Sent" : "Request to Speak"}
            </Button>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {callType === "video" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-140px)]">
            {/* Local Video */}
            <div className="relative bg-gray-800">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                You {!isVideoEnabled && "(Video Off)"}
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-700 flex items-center justify-center">
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-2">
                    {connectedUsers[1]?.name.charAt(0) || "U"}
                  </div>
                  <p className="text-gray-300">{connectedUsers[1]?.name || "Waiting for others..."}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="flex justify-center gap-8">
                {connectedUsers.slice(0, 2).map((user, index) => (
                  <div key={user.id} className="text-center">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-2">
                      {user.name.charAt(0)}
                    </div>
                    <p className="text-gray-300">{user.name}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      {user.isAudioEnabled ? (
                        <Volume2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-400">Audio call in progress</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex justify-center gap-4">
        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full w-12 h-12"
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        {callType === "video" && (
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        )}

        <Button onClick={endCall} variant="destructive" size="lg" className="rounded-full w-12 h-12">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* Speak Request Dialog */}
      <Dialog open={!!showSpeakRequest} onOpenChange={() => setShowSpeakRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎤 Speak Request</DialogTitle>
            <DialogDescription>{showSpeakRequest?.userName} wants to speak in the room.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handleSpeakRequest(false)}>
              Deny
            </Button>
            <Button onClick={() => handleSpeakRequest(true)}>Allow</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
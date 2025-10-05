"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, Video, PhoneOff, VideoOff, Mic, MicOff, Users, ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const roomKey = params.key as string
  const roomType = searchParams.get("type") as "private" | "public"

  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<User[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [speakRequests, setSpeakRequests] = useState<SpeakRequest[]>([])
  const [showSpeakRequest, setShowSpeakRequest] = useState<SpeakRequest | null>(null)
  const [hasRequestedSpeak, setHasRequestedSpeak] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Simulate WebRTC connection
    const mockUsers: User[] = [
      { id: "1", name: "You", isAudioEnabled: true, isVideoEnabled: true },
      { id: "2", name: "User_A4B2", isAudioEnabled: true, isVideoEnabled: false },
      { id: "3", name: "Anonymous_1", isAudioEnabled: false, isVideoEnabled: true },
    ]

    if (roomType === "public") {
      setConnectedUsers(mockUsers)
    } else {
      setConnectedUsers([mockUsers[0], mockUsers[1]])
    }
  }, [roomType])

  const startCall = async (type: "audio" | "video") => {
    try {
      const constraints = {
        audio: true,
        video: type === "video",
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream

      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = stream
      }

      setCallType(type)
      setIsConnected(true)

      toast({
        title: "Connected!",
        description: `${type === "video" ? "Video" : "Audio"} call started successfully.`,
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not access camera/microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    setCallType(null)
    setIsConnected(false)
    router.push("/")
  }

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

  if (!callType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
                {roomType === "public" && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Users className="h-4 w-4" />
                    {connectedUsers.length} users connected
                  </div>
                )}
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
    <div className="min-h-screen bg-black text-white">
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

        {roomType === "public" && (
          <Button onClick={requestToSpeak} disabled={hasRequestedSpeak} variant="outline" size="sm">
            <Mic className="h-4 w-4 mr-2" />
            {hasRequestedSpeak ? "Request Sent" : "Request to Speak"}
          </Button>
        )}
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

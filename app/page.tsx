"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Copy, Key, Plus, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [secretKey, setSecretKey] = useState("")
  const [generatedKey, setGeneratedKey] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const generateSecretKey = async () => {
    setIsGenerating(true)
    
    try {
      // Call API to create room
      const response = await fetch("/api/socket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "create-room" }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setGeneratedKey(data.roomId)
        toast({
          title: "Secret Key Generated!",
          description: "Share this key with others to connect privately.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate secret key. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate secret key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    })
  }

  const validateAndJoinRoom = async (key: string, type: "private" | "public") => {
    if (type === "private" && !key.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid secret key.",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    
    try {
      const roomKey = type === "public" ? "PUBLIC123" : key.toUpperCase()
      
      // Validate room key with API
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
      
      if (data.success) {
        router.push(`/room/${roomKey}?type=${type}`)
      } else {
        toast({
          title: "Invalid Key",
          description: data.message || "The secret key is invalid or has expired.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate room key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleEnterKey = () => {
    if (secretKey.length === 6) {
      validateAndJoinRoom(secretKey, "private")
    } else {
      toast({
        title: "Invalid Key",
        description: "Secret key must be 6 characters long.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" suppressHydrationWarning>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Key className="h-8 w-8 text-blue-600" />
            SecretLink
          </h1>
          <p className="text-gray-600">Talk Anonymously with Secret Keys</p>
        </div>

        {/* Main Actions */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Choose Your Connection</CardTitle>
            <CardDescription>Connect privately or join the public room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enter Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">Enter Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  id="secretKey"
                  placeholder="Enter 6-digit key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-center text-lg"
                />
                <Button 
                  onClick={handleEnterKey} 
                  className="shrink-0" 
                  disabled={secretKey.length !== 6 || isValidating}
                >
                  {isValidating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Generate Secret Key */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" onClick={generateSecretKey} disabled={isGenerating}>
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate Secret Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Secret Key</DialogTitle>
                  <DialogDescription>Share this key with others to connect privately</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {isGenerating ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Generating key...</p>
                    </div>
                  ) : generatedKey ? (
                    <>
                      <div className="text-center">
                        <div className="text-3xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg">
                          {generatedKey}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => copyToClipboard(generatedKey)} className="flex-1">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Key
                        </Button>
                        <Button 
                          onClick={() => validateAndJoinRoom(generatedKey, "private")} 
                          className="flex-1"
                          disabled={isValidating}
                        >
                          {isValidating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                          ) : null}
                          Join Room
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            {/* Pair Default */}
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={() => validateAndJoinRoom("PUBLIC123", "public")}
              disabled={isValidating}
            >
              {isValidating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Join Public Room
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">Powered by WebRTC + Socket.IO</div>
      </div>
    </div>
  )
}
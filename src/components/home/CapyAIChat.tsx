"use client"

import { useState, useRef, useEffect } from "react"
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  ScrollShadow,
  Spinner,
} from "@heroui/react"
import { MessageCircle, Send, X, Sparkles, Bot, Mic, Lightbulb, FileText, Sparkle } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface CapyAIChatProps {
  onTokensUsed?: () => void
}

const CapyAIChat = ({ onTokensUsed }: CapyAIChatProps) => {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [starters, setStarters] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")

  useEffect(() => {
    if (isOpen && messages.length === 0 && status === "authenticated") {
      loadStarters()
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm Capy AI, your MDCAT Biology tutor. Ask me anything about biology topics!",
        },
      ])
    }
  }, [isOpen, status])

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadStarters = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/capy-ai/starters`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.user?.accessToken}`,
        },
      })
      const data = await response.json()
      setStarters(data.starters || [])
    } catch (error) {
      // Silently fail
    }
  }

  const sendMessage = async (messageText?: string) => {
    if (status !== "authenticated") {
      toast.error("Please sign in to use Capy AI")
      return
    }

    const textToSend = messageText || inputMessage.trim()

    if (!textToSend) {
      toast.error("Please enter a message")
      return
    }

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: textToSend,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsStreaming(true)
    setCurrentStreamingMessage("")

    try {
      const accessToken = (session as any)?.user?.accessToken

      console.log("Sending request with token:", accessToken?.substring(0, 20) + "...")

      const response = await fetch(`${API_URL}/api/v1/capy-ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6), // Last 3 exchanges
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send message")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let streamedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "chunk") {
                streamedContent += data.content
                setCurrentStreamingMessage(streamedContent)
              } else if (data.type === "done") {
                // Finalize message
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: streamedContent },
                ])
                setCurrentStreamingMessage("")

                if (onTokensUsed) {
                  onTokensUsed()
                }
              } else if (data.type === "error") {
                throw new Error(data.message)
              } else if (data.type === "off_topic") {
                toast(data.message, { icon: "⚠️", duration: 4000 })
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Capy AI error:", error)

      if (error.message.includes("Gemini required")) {
        toast.error("Please configure Gemini in AI Settings to use Capy AI")
      } else if (error.message.includes("Quota exceeded")) {
        toast.error("Monthly quota exceeded")
      } else {
        toast.error("Failed to send message")
      }

      // Remove user message if failed
      setMessages((prev) => prev.slice(0, -1))
      setCurrentStreamingMessage("")
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleStarterClick = (starter: string) => {
    sendMessage(starter)
  }

  if (status === "loading") {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          isIconOnly
          color="primary"
          size="lg"
          className="fixed bottom-6 right-6 z-50 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Bot size={28} />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[480px] h-[700px] z-50 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-b from-[#e8d5f2] via-[#d9c4e8] to-[#c9b3dd] flex flex-col">
          {/* Close Button */}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-900"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </Button>

          {status !== "authenticated" ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center mb-6 border-4 border-white shadow-lg">
                <Bot size={56} className="text-white" />
              </div>
              <p className="text-gray-700 mb-6 text-lg">Please sign in to chat with Capy AI</p>
              <Button 
                color="primary" 
                size="lg"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => (window.location.href = "/signin")}
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* Avatar at Top */}
              <div className="flex justify-center pt-8 pb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center border-4 border-white shadow-lg">
                  <Bot size={56} className="text-white" />
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden px-6 pb-4">
                <ScrollShadow className="h-full">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mb-1">
                            <Bot size={18} className="text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-[#6b9aed] to-[#5b8ee6] text-white rounded-br-sm"
                              : "bg-[#9b7abf] text-white rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6b9aed] to-[#5b8ee6] flex items-center justify-center flex-shrink-0 mb-1">
                            <MessageCircle size={18} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Streaming message */}
                    {currentStreamingMessage && (
                      <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mb-1">
                          <Bot size={18} className="text-white" />
                        </div>
                        <div className="max-w-[75%] bg-[#9b7abf] text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{currentStreamingMessage}</p>
                          <Spinner size="sm" className="mt-2" color="white" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollShadow>
              </div>

              {/* Quick Action Buttons */}
              {messages.length <= 1 && !isStreaming && (
                <div className="px-6 pb-3 flex gap-2 justify-center flex-wrap">
                  <Button
                    size="sm"
                    variant="bordered"
                    className="bg-white/80 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white rounded-full text-xs"
                    startContent={<Lightbulb size={14} />}
                    onClick={() => handleStarterClick("Explain this topic")}
                  >
                    Explain this topic
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    className="bg-white/80 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white rounded-full text-xs"
                    startContent={<FileText size={14} />}
                    onClick={() => handleStarterClick("Summarize this text")}
                  >
                    Summarize this text
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    className="bg-white/80 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white rounded-full text-xs"
                    startContent={<Sparkle size={14} />}
                    onClick={() => handleStarterClick("Give me example")}
                  >
                    Give me example
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <div className="px-6 pb-6 pt-2">
                <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-2 px-4 py-3">
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isStreaming}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="min-w-8 h-8 text-gray-500 hover:text-gray-700"
                  >
                    <Mic size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    className="min-w-10 h-10 bg-gradient-to-r from-[#6b9aed] to-[#5b8ee6] text-white rounded-full"
                    onClick={() => sendMessage()}
                    isDisabled={!inputMessage.trim() || isStreaming}
                    isLoading={isStreaming}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default CapyAIChat

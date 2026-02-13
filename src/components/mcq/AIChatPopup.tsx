"use client"

import { useState, useRef, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  ScrollShadow,
  Spinner,
} from "@heroui/react"
import { MessageCircle, Send, Sparkles, X, Lightbulb } from "lucide-react"
import Axios from "@/lib/Axios"
import { toast } from "react-hot-toast"

interface Message {
  role: "user" | "ai"
  content: string
  tokensUsed?: number
}

interface AIChatPopupProps {
  isOpen: boolean
  onClose: () => void
  mcq: any
  mcqType: "MCQ" | "SeriesMCQ"
  onTokensUsed?: () => void // Callback to refresh token usage
}

const AIChatPopup = ({ isOpen, onClose, mcq, mcqType, onTokensUsed }: AIChatPopupProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Load suggestions
      loadSuggestions()
      // Add initial greeting
      setMessages([
        {
          role: "ai",
          content: "Hi! I'm here to help you understand this MCQ better. Feel free to ask any questions about the question, options, or the concept being tested.",
        },
      ])
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadSuggestions = async () => {
    if (!mcq?._id) return
    
    try {
      const response = await Axios.get(`/api/v1/ai-chat/suggestions/${mcq._id}`, {
        params: { mcqType },
      })
      setSuggestions(response.data.suggestions || [])
    } catch (error) {
      // Silently fail
    }
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    
    if (!mcq?._id) {
      toast.error("MCQ data not available")
      return
    }
    
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
    setIsLoading(true)

    try {
      // Build conversation history
      const conversationHistory = messages
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({
          user: m.role === "user" ? m.content : "",
          ai: m.role === "ai" ? m.content : "",
        }))
        .filter((h) => h.user || h.ai)

      const response = await Axios.post("/api/v1/ai-chat/message", {
        mcqId: mcq._id,
        mcqType,
        message: textToSend,
        conversationHistory,
      })

      const aiMessage: Message = {
        role: "ai",
        content: response.data.response,
        tokensUsed: response.data.tokensUsed,
      }

      setMessages((prev) => [...prev, aiMessage])

      // Show off-topic warning
      if (response.data.isOffTopic) {
        toast("Please keep questions related to this MCQ", {
          icon: "⚠️",
          duration: 3000,
        })
      }

      // Notify parent to refresh token usage
      if (onTokensUsed) {
        onTokensUsed()
      }
    } catch (error: any) {
      const errorData = error.response?.data

      if (errorData?.action === "api_key_required") {
        toast.error("Please configure your AI API key in settings")
      } else if (errorData?.error === "Quota exceeded") {
        toast.error("Monthly quota exceeded")
      } else {
        toast.error("Failed to send message")
      }

      // Remove user message if failed
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClose = () => {
    setMessages([])
    setInputMessage("")
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
        body: "p-0",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 border-b">
          <MessageCircle className="text-blue-600" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Ask About This MCQ</h3>
            <p className="text-xs text-gray-500 font-normal">Get help understanding this question</p>
          </div>
          <Button isIconOnly variant="light" size="sm" onClick={handleClose}>
            <X size={20} />
          </Button>
        </ModalHeader>

        <ModalBody className="p-4">
          {/* MCQ Context Card */}
          <Card className="bg-blue-50 border-blue-200 mb-4">
            <CardBody className="p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Question Context:</p>
                  <p className="text-blue-800 line-clamp-2">{mcq?.question || "Question not available"}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Messages */}
          <ScrollShadow className="flex-1 space-y-4 mb-4 max-h-[400px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 border border-gray-200"
                  }`}
                >
                  {message.role === "ai" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.tokensUsed && (
                    <p className="text-xs mt-2 opacity-70">
                      {message.tokensUsed} tokens used
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollShadow>

          {/* Suggestions */}
          {messages.length <= 2 && suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <Chip
                    key={index}
                    variant="flat"
                    color="primary"
                    size="sm"
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t p-3">
          <div className="flex gap-2 w-full">
            <Input
              placeholder="Ask a question about this MCQ..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              classNames={{
                input: "text-sm",
                inputWrapper: "h-12",
              }}
              endContent={
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  onClick={() => sendMessage()}
                  isDisabled={!inputMessage.trim() || isLoading}
                  isLoading={isLoading}
                >
                  <Send size={18} />
                </Button>
              }
            />
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AIChatPopup

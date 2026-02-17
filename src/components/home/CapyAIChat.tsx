"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
  Button,
  ScrollShadow,
  Spinner,
} from "@heroui/react"
import { MessageCircle, Send, X, Bot, Lightbulb, FileText, Sparkle } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface Message {
  role: "user" | "assistant"
  content: string
}

/* ─── Lightweight Markdown Renderer ─── */
function formatMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-1.5">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  const formatInline = (raw: string, key: number): React.ReactNode => {
    // Process bold (**text**) and italic (*text*) with a regex pipeline
    const parts: React.ReactNode[] = []
    // Match **bold**, *italic*, and plain text
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(raw)) !== null) {
      // Push text before match
      if (match.index > lastIndex) {
        parts.push(raw.slice(lastIndex, match.index))
      }
      if (match[2]) {
        // Bold
        parts.push(<strong key={`b-${key}-${match.index}`} className="font-semibold">{match[2]}</strong>)
      } else if (match[3]) {
        // Italic
        parts.push(<em key={`i-${key}-${match.index}`}>{match[3]}</em>)
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < raw.length) {
      parts.push(raw.slice(lastIndex))
    }
    return parts.length > 0 ? parts : raw
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trimStart()

    // Bullet list items: "* text", "- text", "• text"
    const bulletMatch = trimmed.match(/^(?:[\*\-•])\s+(.+)/)
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${idx}`} className="text-sm leading-relaxed">
          {formatInline(bulletMatch[1], idx)}
        </li>
      )
      return
    }

    // Numbered list items: "1. text", "1) text"
    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)/)
    if (numMatch) {
      listItems.push(
        <li key={`li-${idx}`} className="text-sm leading-relaxed">
          {formatInline(numMatch[1], idx)}
        </li>
      )
      return
    }

    flushList()

    // Empty line → spacer
    if (trimmed === "") {
      elements.push(<div key={`sp-${idx}`} className="h-1.5" />)
      return
    }

    // Heading: "## text" or "# text"
    if (trimmed.startsWith("## ")) {
      elements.push(
        <p key={`h-${idx}`} className="font-bold text-sm mt-2 mb-0.5">
          {formatInline(trimmed.slice(3), idx)}
        </p>
      )
      return
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <p key={`h-${idx}`} className="font-bold text-[15px] mt-2 mb-0.5">
          {formatInline(trimmed.slice(2), idx)}
        </p>
      )
      return
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed">
        {formatInline(trimmed, idx)}
      </p>
    )
  })

  flushList()
  return elements
}

/* ─── Rotating Introduction Messages ─── */
const INTRO_MESSAGES = [
  "Welcome! Capy is here to make MDCAT preparation clear, focused, and stress-free. ✨",
  "Stuck on a concept? I'm Capy — let's work through it together. 🧠",
  "Capy AI is built to help MDCAT aspirants master concepts and MCQs efficiently. 🎯",
  "Clear concepts. High-yield MCQs. Smart revision. Let's begin. 📘",
  "Your personal MDCAT tutor is ready. Ask away. 💬",
  "Dreaming of a medical college? Start with the right question. 🩺",
  "Every great doctor starts with a question. What's yours? ❓",
  "One doubt at a time — let's push your MDCAT score higher. 📈",
  "Capy AI is here: ask, learn, revise, and repeat. 🔁",
  "Let's turn doubts into marks. 📊",
  "Start your MDCAT preparation here. 🚀",
  "What would you like to study today? 📖",
  "Ask me an MCQ, a concept, or a quick revision tip. ⚡",
  "MDCAT prep starts with one smart question. 💡",
  "Confused today? Clear by tonight. Let's start. 🌙",
  "Concepts first. Marks next. Capy AI at your service. 🤖",
  "Turn your doubts into confidence. ✨",
  "Your MDCAT journey just got easier. 🌱",
  "Let's simplify biology, chemistry, and physics — together. 🧬",
  "One question closer to your dream medical college. 🌟",
  "I explain like a mentor, not a textbook. 📚",
  "Stuck between options? Let's eliminate strategically. ✅",
  "High-yield MDCAT prep starts here. 🎓",
  "Revision, MCQs, and explanations — all in one place. 🛡️",
  "No pressure. Just ask and learn. 🌿",
  "Capy AI is ready. What's troubling you today? 🤔",
  "Every doubt you clear brings you closer to the white coat. 🩺",
  "Start small. Stay consistent. I'm right here with you. 🤍",
  "Your dream medical college is waiting. Ask your first question. ✨",
]

/* ─── Component ─── */
const CapyAIChat = () => {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [starters, setStarters] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const [introMessage, setIntroMessage] = useState("")

  // Whether the user has started chatting (more than the welcome message)
  const hasStartedChatting = messages.length > 1 || isStreaming

  useEffect(() => {
    if (isOpen && messages.length === 0 && status === "authenticated") {
      loadStarters()
      const randomIntro = INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)]
      setIntroMessage(randomIntro)
      setMessages([
        {
          role: "assistant",
          content: randomIntro,
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

      const response = await fetch(`${API_URL}/api/v1/capy-ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6),
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
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: streamedContent },
                ])
                setCurrentStreamingMessage("")
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
      {/* ── Inline keyframes ── */}
      <style jsx global>{`
        @keyframes capySlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes capyFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes capyPulse {
          0%, 80%, 100% { opacity: 0.35; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes capyBtnPop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        .capy-widget  { animation: capySlideUp 0.35s cubic-bezier(.16,1,.3,1) both; }
        .capy-msg     { animation: capyFadeIn  0.3s  ease-out both; }
        .capy-btn-pop { animation: capyBtnPop  0.4s  cubic-bezier(.34,1.56,.64,1) both; }
        .capy-dot { animation: capyPulse 1.4s infinite both; }
        .capy-dot:nth-child(2) { animation-delay: 0.2s; }
        .capy-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* ── Toggle Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="capy-btn-pop fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] text-white shadow-lg shadow-purple-300/40 hover:shadow-xl hover:shadow-purple-400/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
        >
          <Bot size={26} />
        </button>
      )}

      {/* ── Chat Widget ── */}
      {isOpen && (
        <div className="capy-widget fixed bottom-6 right-6 w-[min(460px,calc(100vw-2rem))] h-[min(680px,calc(100vh-3rem))] z-50 rounded-3xl overflow-hidden flex flex-col border border-white/30 shadow-2xl shadow-purple-900/20 backdrop-blur-xl bg-gradient-to-b from-[#f0e6f6]/95 via-[#e4d4f0]/95 to-[#d8c5e6]/95">

          {/* ── Header bar ── */}
          <div className="relative flex items-center gap-3 px-5 pt-4 pb-3 shrink-0">
            {/* Compact avatar that's always visible */}
            <div
              className={`rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center border-2 border-white/70 shadow-md transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                hasStartedChatting
                  ? "w-10 h-10"
                  : "w-10 h-10"
              }`}
            >
              <Bot size={20} className="text-white" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-[15px] text-gray-800 leading-tight">Capy AI</span>
              <span className="text-[11px] text-gray-500 leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                MDCAT Tutor
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {status !== "authenticated" ? (
            /* ── Signed-out state ── */
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center mb-5 border-4 border-white shadow-lg animate-pulse3d">
                <Bot size={44} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Welcome to Capy AI</h3>
              <p className="text-gray-500 mb-6 text-sm">Sign in to start chatting with your MDCAT tutor</p>
              <Button
                color="primary"
                size="lg"
                className="bg-gradient-to-r from-[#9b7abf] to-[#7c5fa3] text-white rounded-full px-8 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => (window.location.href = "/signin")}
              >
                Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* ── Hero area (only before chatting) ── */}
              {!hasStartedChatting && (
                <div className="capy-msg flex flex-col items-center px-6 pt-3 pb-2 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center border-[3px] border-white shadow-lg mb-3">
                    <Bot size={38} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-base">How can I help you today?</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{introMessage || "Ask me anything about MDCAT"}</p>
                </div>
              )}

              {/* ── Messages ── */}
              <div className="flex-1 overflow-hidden px-4 pb-2">
                <ScrollShadow className="h-full">
                  <div className="space-y-3 py-2">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`capy-msg flex items-end gap-2 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                        style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                      >
                        {message.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                            <Bot size={14} className="text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-[#7c6adb] to-[#6b5ce7] text-white rounded-br-md"
                              : "bg-white/80 backdrop-blur-sm text-gray-800 rounded-bl-md border border-white/50"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="space-y-0.5">{formatMarkdown(message.content)}</div>
                          ) : (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c6adb] to-[#6b5ce7] flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                            <MessageCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Streaming message */}
                    {currentStreamingMessage && (
                      <div className="capy-msg flex items-end gap-2 justify-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                          <Bot size={14} className="text-white" />
                        </div>
                        <div className="max-w-[78%] bg-white/80 backdrop-blur-sm text-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm border border-white/50">
                          <div className="space-y-0.5">{formatMarkdown(currentStreamingMessage)}</div>
                          <div className="flex items-center gap-1 mt-2">
                            <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Typing indicator when waiting for first chunk */}
                    {isStreaming && !currentStreamingMessage && (
                      <div className="capy-msg flex items-end gap-2 justify-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
                          <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-md px-5 py-3 shadow-sm border border-white/50">
                          <div className="flex items-center gap-1.5">
                            <span className="capy-dot w-2 h-2 rounded-full bg-purple-400" />
                            <span className="capy-dot w-2 h-2 rounded-full bg-purple-400" />
                            <span className="capy-dot w-2 h-2 rounded-full bg-purple-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollShadow>
              </div>

              {/* ── Quick Starters (only before chatting) ── */}
              {messages.length <= 1 && !isStreaming && (
                <div className="px-5 pb-2 flex gap-2 justify-center flex-wrap shrink-0">
                  {[
                    { icon: <Lightbulb size={13} />, label: "Explain a topic" },
                    { icon: <FileText size={13} />, label: "Summarize this" },
                    { icon: <Sparkle size={13} />, label: "Give me an example" },
                  ].map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => handleStarterClick(starter.label)}
                      className="capy-msg flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-gray-600 bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm hover:bg-white hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                      style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                    >
                      {starter.icon}
                      {starter.label}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input Area ── */}
              <div className="px-4 pb-4 pt-2 shrink-0">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 flex items-center gap-2 px-4 py-2.5 transition-shadow focus-within:shadow-xl focus-within:border-purple-200">
                  <input
                    type="text"
                    placeholder="Type your question here..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isStreaming}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isStreaming}
                    className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#9b7abf] to-[#7c5fa3] text-white flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    {isStreaming ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
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

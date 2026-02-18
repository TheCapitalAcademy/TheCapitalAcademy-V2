"use client"

import { useState, useEffect, useRef } from "react"
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
  Spinner,
  useDisclosure,
} from "@heroui/react"
import {
  Bot,
  Send,
  Settings,
  Key,
  CheckCircle,
  ExternalLink,
  X,
  MessageCircle,
  Lightbulb,
  FileText,
  Sparkle,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Copy,
  ChevronRight,
} from "lucide-react"
import Axios from "@/lib/Axios"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/* ─── Markdown Component Styles ─── */
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="markdown-content text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2.5 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-[15px] font-semibold mt-2 mb-1" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-semibold mt-1.5 mb-0.5" {...props} />,
          p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 ml-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-2" {...props} />,
          li: ({ node, ...props }) => <li className="text-sm leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-gray-100 text-purple-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
            ) : (
              <code className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props} />
            ),
          pre: ({ node, ...props }) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto my-2" {...props} />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-300 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b border-gray-300" {...props} />,
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 px-3 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => <td className="border border-gray-300 px-3 py-2" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-purple-300 pl-3 py-1 my-2 italic text-gray-700" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/* ─── Types ─── */
interface Message {
  role: "user" | "assistant"
  content: string
}

/* ─── Main Component ─── */
const AISettings = () => {
  const { data: session, status } = useSession()

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Settings state
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure()
  const [config, setConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [apiKey, setApiKey] = useState("")

  // Setup guide state
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [setupStep, setSetupStep] = useState(0)

  const hasKey = config?.hasApiKey

  const INTRO_MESSAGES = [
    "Welcome! Capy is here to make your study sessions clear, focused, and stress-free. ✨",
    "Stuck on a concept? I'm Capy — let's work through it together. 🧠",
    "Capy AI is built to help you master concepts and ace your exams efficiently. 🎯",
    "Clear concepts. Top grades. Smart revision. Let's begin. 📘",
    "Your personal tutor is ready. Ask away. 💬",
    "Every great achievement starts with a question. What's yours? ❓",
    "One doubt at a time — let's push your scores higher. 📈",
    "Capy AI is here: ask, learn, revise, and repeat. 🔁",
    "Let's turn doubts into marks. 📊",
    "Start your study session here. 🚀",
    "What would you like to study today? 📖",
    "Ask me about any topic, concept, or a quick revision tip. ⚡",
    "Great learning starts with one smart question. 💡",
    "Confused today? Clear by tonight. Let's start. 🌙",
    "Concepts first. Marks next. Capy AI at your service. 🤖",
    "Turn your doubts into confidence. ✨",
    "Your study journey just got easier. 🌱",
    "Let's simplify even the toughest topics — together. 🧬",
    "No pressure. Just ask and learn. 🌿",
    "Capy AI is ready. What's troubling you today? 🤔",
    "Every doubt you clear brings you closer to success. 🩺",
    "Start small. Stay consistent. I'm right here with you. 🤍",
  ]

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    if (messages.length === 0 && status === "authenticated") {
      const randomIntro = INTRO_MESSAGES[Math.floor(Math.random() * INTRO_MESSAGES.length)]
      setMessages([{
        role: "assistant",
        content: randomIntro,
      }])
    }
  }, [status])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentStreamingMessage])

  const fetchConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await Axios.get("/api/v1/ai-settings")
      setConfig(response.data)
    } catch (error) {
      // Config not set up yet
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey) { toast.error("Please enter an API key"); return }
    try {
      await Axios.put("/api/v1/ai-settings/provider", { aiProvider: "gemini", apiKey })
      toast.success("API key saved successfully!")
      setApiKey("")
      fetchConfig()
      onSettingsClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save settings")
    }
  }

  const handleTestKey = async () => {
    if (!apiKey) { toast.error("Please enter an API key"); return }
    try {
      setTesting(true)
      const response = await Axios.post("/api/v1/ai-settings/test-key", { aiProvider: "gemini", apiKey })
      if (response.data.success) toast.success("API key is valid! ✅")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "API key validation failed")
    } finally { setTesting(false) }
  }

  const handleRemoveKey = async () => {
    if (!confirm("Are you sure you want to remove your API key?")) return
    try {
      await Axios.delete("/api/v1/ai-settings/provider")
      toast.success("API key removed")
      fetchConfig()
    } catch (error) { toast.error("Failed to remove API key") }
  }

  /* ─── Chat Logic ─── */
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend) return

    if (!hasKey) {
      toast.error("Please configure your API key first")
      onSettingsOpen()
      return
    }

    const userMessage: Message = { role: "user", content: textToSend }
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
        body: JSON.stringify({ message: textToSend, history: messages.slice(-6) }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send message")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No response body")

      let streamedContent = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "chunk") {
                streamedContent += data.content
                setCurrentStreamingMessage(streamedContent)
              } else if (data.type === "done") {
                setMessages((prev) => [...prev, { role: "assistant", content: streamedContent }])
                setCurrentStreamingMessage("")
              } else if (data.type === "error") throw new Error(data.message)
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
    } catch (error: any) {
      console.error("Capy AI error:", error)
      if (error.message.includes("Gemini required")) {
        toast.error("Please configure Gemini in settings to use Capy AI")
      } else if (error.message.includes("Quota exceeded")) {
        toast.error("Monthly quota exceeded")
      } else {
        toast.error("Failed to send message")
      }
      setMessages((prev) => prev.slice(0, -1))
      setCurrentStreamingMessage("")
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const hasStartedChatting = messages.length > 1 || isStreaming

  const setupSteps = [
    {
      title: "Go to Google AI Studio",
      description: "Visit Google AI Studio to create your free API key",
      action: (
        <Button
          color="primary"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          endContent={<ExternalLink size={16} />}
          onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}
        >
          Open Google AI Studio
        </Button>
      ),
    },
    {
      title: "Sign in with Google",
      description: "Use your Google account to sign in. It's free — no credit card required.",
    },
    {
      title: 'Click "Create API Key"',
      description: "On the API keys page, click the button to generate a new key. Select any project or create one.",
    },
    {
      title: "Copy your API Key",
      description: 'Your key will look like: AIzaSy... — copy it and paste it in the API Key field below.',
    },
  ]

  /* ─── Render ─── */
  return (
    <>
      {/* Inline animations */}
      <style jsx global>{`
        @keyframes capyFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes capyPulse {
          0%, 80%, 100% { opacity: 0.35; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .capy-msg     { animation: capyFadeIn 0.3s ease-out both; }
        .capy-dot     { animation: capyPulse 1.4s infinite both; }
        .capy-dot:nth-child(2) { animation-delay: 0.2s; }
        .capy-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center shadow-md">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-gray-900 leading-tight">Capy AI</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                {hasKey ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Study Tutor</>
                ) : (
                  <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> API key required</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onSettingsOpen}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* ─── Chat Area ─── */}
        <div className="flex-1 overflow-hidden">
          <ScrollShadow className="h-full px-4 lg:px-6">
            <div className="max-w-3xl mx-auto py-4 space-y-4">
              {/* Welcome hero (only before chatting) */}
              {!hasStartedChatting && (
                <div className="capy-msg flex flex-col items-center py-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center shadow-lg mb-4">
                    <Bot size={38} className="text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">How can I help you today?</h2>
                  <p className="text-gray-500 text-sm max-w-md">
                    Ask me anything about any subject — I'm here to help you learn and succeed.
                  </p>

                  {/* API key warning */}
                  {!hasKey && !configLoading && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 max-w-md w-full">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="font-medium text-amber-800 text-sm">API Key Required</p>
                          <p className="text-amber-700 text-xs mt-1">
                            You need a free Google Gemini API key to use Capy AI.
                          </p>
                          <Button
                            size="sm"
                            color="warning"
                            variant="flat"
                            className="mt-3"
                            onClick={onSettingsOpen}
                            endContent={<ChevronRight size={14} />}
                          >
                            Set Up API Key
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`capy-msg flex items-start gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#7c6adb] to-[#6b5ce7] text-white rounded-tr-md shadow-sm"
                        : "bg-gray-50 text-gray-800 rounded-tl-md border border-gray-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownContent content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c6adb] to-[#6b5ce7] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <MessageCircle size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming */}
              {currentStreamingMessage && (
                <div className="capy-msg flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="max-w-[80%] bg-gray-50 text-gray-800 rounded-2xl rounded-tl-md px-4 py-3 border border-gray-100">
                    <MarkdownContent content={currentStreamingMessage} />
                    <div className="flex items-center gap-1 mt-2">
                      <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="capy-dot w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isStreaming && !currentStreamingMessage && (
                <div className="capy-msg flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b7abf] to-[#7c5fa3] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md px-5 py-3.5 border border-gray-100">
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

        {/* ─── Quick Starters ─── */}
        {!hasStartedChatting && hasKey && (
          <div className="px-4 lg:px-6 pb-2 flex gap-2 justify-center flex-wrap shrink-0">
            {[
              { icon: <Lightbulb size={14} />, label: "Explain a concept" },
              { icon: <FileText size={14} />, label: "Summarize a topic" },
              { icon: <Sparkle size={14} />, label: "Give me an example" },
            ].map((starter, i) => (
              <button
                key={i}
                onClick={() => sendMessage(starter.label)}
                className="capy-msg flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ animationDelay: `${0.15 + i * 0.08}s` }}
              >
                {starter.icon}
                {starter.label}
              </button>
            ))}
          </div>
        )}

        {/* ─── Input Area ─── */}
        <div className="px-4 lg:px-6 pb-4 pt-3 shrink-0">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2 px-4 py-2.5 transition-all focus-within:shadow-md focus-within:border-purple-300">
            <input
              ref={inputRef}
              type="text"
              placeholder={hasKey ? "Ask Capy AI anything..." : "Set up your API key to start chatting..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isStreaming || !hasKey}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isStreaming || !hasKey}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#9b7abf] to-[#7c5fa3] text-white flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {isStreaming ? <Spinner size="sm" color="white" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-2">Capy AI uses Google Gemini. Responses may not always be accurate.</p>
        </div>
      </div>

      {/* ─── Settings Modal ─── */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 border-b pb-4">
            <Settings size={20} className="text-gray-600" />
            <div>
              <h3 className="text-lg font-semibold">Capy AI Settings</h3>
              <p className="text-xs text-gray-500 font-normal">Configure your API key for Capy AI</p>
            </div>
          </ModalHeader>

          <ModalBody className="py-6 space-y-6">
            {/* Status banner */}
            {hasKey ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={22} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-medium text-green-800 text-sm">API Key Active</p>
                  <p className="text-green-700 text-xs mt-0.5">
                    Your Google Gemini key is configured and ready to use.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={22} className="text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 text-sm">No API Key Configured</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Add a Google Gemini API key to start using Capy AI.
                  </p>
                </div>
              </div>
            )}

            {/* Setup Guide */}
            <div>
              <button
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
              >
                <Zap size={16} />
                {showSetupGuide ? "Hide" : "Show"} Setup Guide — Get your free API key
                <ChevronRight size={14} className={`transition-transform ${showSetupGuide ? "rotate-90" : ""}`} />
              </button>

              {showSetupGuide && (
                <div className="mt-4 space-y-3">
                  {setupSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                        setupStep === i ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100"
                      }`}
                      onClick={() => setSetupStep(i)}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        setupStep === i
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                        {step.action && <div className="mt-2">{step.action}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Key size={16} />
                Google Gemini API Key
              </label>
              <Input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                classNames={{
                  input: "font-mono text-sm",
                  inputWrapper: "h-12",
                }}
              />
              <div className="flex gap-2">
                <Button
                  color="primary"
                  className="flex-1 bg-gradient-to-r from-[#9b7abf] to-[#7c5fa3]"
                  onClick={handleSave}
                  isDisabled={!apiKey}
                >
                  Save Key
                </Button>
                <Button
                  variant="bordered"
                  className="flex-1"
                  onClick={handleTestKey}
                  isLoading={testing}
                  isDisabled={!apiKey}
                >
                  Test Key
                </Button>
                {hasKey && (
                  <Button
                    color="danger"
                    variant="flat"
                    isIconOnly
                    onClick={handleRemoveKey}
                    title="Remove API Key"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ShieldCheck size={16} />
                How it works
              </div>
              <ul className="text-xs text-gray-600 space-y-1.5 ml-6 list-disc">
                <li>Your API key is encrypted and stored securely</li>
                <li>Capy AI uses Google Gemini 2.5 Flash — fast and free tier available</li>
                <li>Generated explanations are cached to minimize API calls</li>
                <li>You can remove your key at any time</li>
              </ul>
            </div>
          </ModalBody>

          <ModalFooter className="border-t">
            <Button variant="light" onClick={onSettingsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default AISettings

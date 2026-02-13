"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Phone } from 'lucide-react'

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Show button after page loads
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const whatsappNumber = "+923479598144" // Replace with your actual WhatsApp number
  const defaultMessage = "Hi! I'm interested in learning more about The Capital Academy."

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`
    window.open(url, "_blank")
    setIsOpen(false)
  }

  const handleCallClick = () => {
    window.open(`tel:${whatsappNumber}`, "_self")
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 left-6 z-50">
          {/* Expanded Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.2 }}
                className="mb-4 bg-white rounded-2xl shadow-2xl border overflow-hidden"
                style={{ borderColor: "#e5e7eb" }}
              >
                {/* Header */}
                <div 
                  className="p-4 text-white"
                  style={{ background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">The Capital Academy</h3>
                        <p className="text-xs" style={{ opacity: 0.9 }}>Online now</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Hi there! 👋 How can we help you today?</p>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors group"
                      style={{ backgroundColor: "#dcfce7" }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#bbf7d0")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#dcfce7")}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#22c55e" }}
                      >
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm" style={{ color: "#1f2937" }}>Chat on WhatsApp</p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>Start a conversation</p>
                      </div>
                    </button>

                    <button
                      onClick={handleCallClick}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors group"
                      style={{ backgroundColor: "#f3e8ff" }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#e9d5ff")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#f3e8ff")}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#a855f7" }}
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm" style={{ color: "#1f2937" }}>Call Us</p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>Speak directly with us</p>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Floating Button */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 relative group"
            style={{ 
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 8px 32px rgba(34, 197, 94, 0.3)"
            }}
            onMouseEnter={(e) => (e.target.style.boxShadow = "0 12px 40px rgba(34, 197, 94, 0.4)")}
            onMouseLeave={(e) => (e.target.style.boxShadow = "0 8px 32px rgba(34, 197, 94, 0.3)")}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="whatsapp"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageCircle className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse Animation */}
            {!isOpen && (
              <div 
                className="absolute inset-0 rounded-full animate-ping" 
                style={{ backgroundColor: "#22c55e", opacity: 0.2 }}
              />
            )}

            {/* Notification Badge */}
            {!isOpen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#ef4444" }}
              >
                <span className="text-xs font-bold text-white">1</span>
              </motion.div>
            )}
          </motion.button>

          {/* Tooltip */}
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-20 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ backgroundColor: "#1f2937", color: "#ffffff" }}
            >
              Need help? Chat with us!
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45"
                style={{ backgroundColor: "#1f2937" }}
              />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}

export default FloatingWhatsApp

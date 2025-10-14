"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface AICopilotProps {
  message?: string
  isTyping?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AICopilot({
  message = "What do you want to do?",
  isTyping = false,
  size = "md",
  className = "",
}: AICopilotProps) {
  const [displayMessage, setDisplayMessage] = useState("")
  const [showCursor, setShowCursor] = useState(true)

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  useEffect(() => {
    if (isTyping && message) {
      setDisplayMessage("")
      let i = 0
      const timer = setInterval(() => {
        if (i < message.length) {
          setDisplayMessage(message.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
        }
      }, 50)
      return () => clearInterval(timer)
    } else {
      setDisplayMessage(message)
    }
  }, [message, isTyping])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden`}
        animate={{
          boxShadow: [
            "0 0 20px rgba(139, 92, 246, 0.5)",
            "0 0 40px rgba(139, 92, 246, 0.8)",
            "0 0 20px rgba(139, 92, 246, 0.5)",
          ],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        {/* Holographic effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        {/* AI Core */}
        <motion.div
          className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full" />
        </motion.div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/70 backdrop-blur-sm border border-purple-500/30 rounded-lg px-4 py-2 max-w-xs"
        >
          <p className="text-sm text-purple-300 font-mono">
            {displayMessage}
            {(isTyping || showCursor) && <span className="text-green-400">|</span>}
          </p>
        </motion.div>
      )}
    </div>
  )
}

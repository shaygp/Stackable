"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function CosmicBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Starfield Layers */}
      <div className="starfield" />

      {/* Nebula Effects */}
      <div className="nebula" />

      {/* Cosmic Dust */}
      <div className="cosmic-dust" />

      {/* Shooting Stars */}
      <div className="shooting-star shooting-star-1" />
      <div className="shooting-star shooting-star-2" />
      <div className="shooting-star shooting-star-3" />

      {/* Pulsing Stars */}
      <div className="pulsar pulsar-1" />
      <div className="pulsar pulsar-2" />
      <div className="pulsar pulsar-3" />
      <div className="pulsar pulsar-4" />

      {/* Animated Constellation */}
      <motion.div
        className="fixed top-1/4 right-1/4 pointer-events-none z-2"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Constellation Lines */}
          <motion.path
            d="M20,20 L40,30 L60,15 L80,25 L70,50 L50,60 L30,55 L20,20"
            stroke="rgba(168, 85, 247, 0.4)"
            strokeWidth="1"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
          />

          {/* Constellation Stars */}
          {[
            { x: 20, y: 20 },
            { x: 40, y: 30 },
            { x: 60, y: 15 },
            { x: 80, y: 25 },
            { x: 70, y: 50 },
            { x: 50, y: 60 },
            { x: 30, y: 55 },
          ].map((star, index) => (
            <motion.circle
              key={index}
              cx={star.x}
              cy={star.y}
              r="2"
              fill="rgba(168, 85, 247, 0.8)"
              filter="url(#glow)"
              animate={{
                opacity: [0.3, 1, 0.3],
                r: [1.5, 2.5, 1.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.3,
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Floating Cosmic Orbs */}
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={index}
          className="fixed pointer-events-none z-1"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 20 + 10}px`,
            height: `${Math.random() * 20 + 10}px`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(168, 85, 247, ${Math.random() * 0.3 + 0.1}) 0%, transparent 70%)`,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px rgba(168, 85, 247, ${Math.random() * 0.3 + 0.1})`,
            }}
          />
        </motion.div>
      ))}
    </>
  )
}

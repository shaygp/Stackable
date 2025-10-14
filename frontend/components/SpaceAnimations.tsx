"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaRocket as Rocket } from 'react-icons/fa'

export function SpaceAnimations() {
  const [stars, setStars] = useState<Array<{ left: string; top: string; delay: number; duration: number }>>([])

  useEffect(() => {
    // Generate random stars
    const newStars = Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Animated Stars */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#FF5500] rounded-full"
          style={{ left: star.left, top: star.top }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}

      {/* Floating Rocket 1 */}
      <motion.div
        className="absolute top-[20%] left-[10%]"
        animate={{
          y: [-20, 20, -20],
          rotate: [-5, 5, -5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <Rocket className="w-12 h-12 text-[#FF5500]" strokeWidth={1.5} />
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-[#FF5500] to-transparent"
            animate={{
              opacity: [0.5, 1, 0.5],
              height: ["40px", "60px", "40px"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      {/* Floating Rocket 2 */}
      <motion.div
        className="absolute top-[60%] right-[15%]"
        animate={{
          y: [20, -20, 20],
          rotate: [5, -5, 5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <Rocket className="w-16 h-16 text-[#F7931A] opacity-60" strokeWidth={1.5} />
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-1.5 h-16 bg-gradient-to-b from-[#F7931A] to-transparent"
            animate={{
              opacity: [0.4, 0.8, 0.4],
              height: ["50px", "80px", "50px"],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      {/* Orbiting Moon */}
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{ transformOrigin: "center" }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="absolute"
          style={{
            top: "-200px",
            left: "0",
          }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5500] to-[#DD4400] opacity-30 blur-sm" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-[#FF5500] opacity-40">
              <motion.div
                className="absolute inset-2 rounded-full bg-[#FF5500] opacity-20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Shooting Stars */}
      <motion.div
        className="absolute top-[10%] right-[20%] w-32 h-0.5 bg-gradient-to-r from-transparent via-[#FF5500] to-transparent"
        animate={{
          x: [0, -300],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 5,
        }}
      />

      <motion.div
        className="absolute top-[70%] left-[30%] w-24 h-0.5 bg-gradient-to-r from-transparent via-[#F7931A] to-transparent"
        animate={{
          x: [0, -200],
          y: [0, 50],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 8,
        }}
      />

      {/* Launch Countdown - Bottom Right */}
      <motion.div
        className="absolute bottom-20 right-10"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <div className="mission-control-panel p-4 rounded-lg">
          <div className="font-orbitron text-sm text-[#FF5500] mb-2">MISSION STATUS</div>
          <motion.div
            className="text-2xl font-orbitron font-bold text-[#FF5500]"
            animate={{
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            ACTIVE
          </motion.div>
        </div>
      </motion.div>

      {/* Orbiting Satellites */}
      <motion.div
        className="absolute top-[30%] left-[20%]"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div style={{ transform: "translateX(80px)" }}>
          <div className="w-3 h-3 bg-[#FF5500] rounded-full shadow-[0_0_10px_#FF5500]" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-[50%] right-[25%]"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div style={{ transform: "translateX(100px)" }}>
          <div className="w-2 h-2 bg-[#F7931A] rounded-full shadow-[0_0_8px_#F7931A]" />
        </div>
      </motion.div>

      {/* Large Moon in Background */}
      <motion.div
        className="absolute top-[15%] right-[5%]"
        animate={{
          y: [-10, 10, -10],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF5500]/20 to-[#DD4400]/10 blur-2xl" />
          <div className="absolute inset-4 rounded-full border border-[#FF5500]/30">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF5500]/10 to-transparent" />
          </div>
          {/* Moon craters */}
          <div className="absolute top-8 left-8 w-4 h-4 rounded-full border border-[#FF5500]/20 bg-[#FF5500]/5" />
          <div className="absolute top-16 right-8 w-3 h-3 rounded-full border border-[#FF5500]/20 bg-[#FF5500]/5" />
          <div className="absolute bottom-10 left-12 w-5 h-5 rounded-full border border-[#FF5500]/20 bg-[#FF5500]/5" />
        </div>
      </motion.div>

      {/* Rocket Launch Trail - Left Side */}
      <motion.div
        className="absolute bottom-0 left-[15%]"
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -800, opacity: 0 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 6,
          ease: "easeOut",
        }}
      >
        <div className="relative">
          <Rocket className="w-8 h-8 text-[#FF5500]" style={{ transform: "rotate(-90deg)" }} />
          <motion.div
            className="absolute top-0 left-full ml-2 w-24 h-1 bg-gradient-to-r from-[#FF5500] to-transparent"
            animate={{
              width: ["0px", "100px", "150px"],
              opacity: [1, 0.5, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      {/* Planet/Orbit Rings */}
      <motion.div
        className="absolute top-1/3 left-1/4"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-64 h-64 rounded-full border border-[#FF5500]/10" />
      </motion.div>

      <motion.div
        className="absolute top-1/3 left-1/4"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-80 h-80 rounded-full border border-[#F7931A]/5" />
      </motion.div>

      {/* Floating Asteroids */}
      <motion.div
        className="absolute top-[40%] left-[5%]"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-4 h-4 bg-[#FF5500]/20 rounded-sm border border-[#FF5500]/30" />
      </motion.div>

      <motion.div
        className="absolute top-[80%] right-[30%]"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-3 h-3 bg-[#F7931A]/15 rounded-sm border border-[#F7931A]/25" />
      </motion.div>

      {/* Rocket Exhaust Particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`exhaust-${i}`}
          className="absolute bottom-[10%] left-[15%]"
          initial={{ y: 0, opacity: 0.6, scale: 1 }}
          animate={{ y: 50, opacity: 0, scale: 0.5 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.3,
            repeatDelay: 5.7,
          }}
        >
          <div className="w-2 h-2 bg-[#FF5500] rounded-full blur-sm" />
        </motion.div>
      ))}
    </div>
  )
}

"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"

export const TextHoverEffect = ({
  text,
  duration,
}: {
  text: string
  duration?: number
  automatic?: boolean
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" })

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect()
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      })
    }
  }, [cursor])

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 1000 300"
      xmlns="http://www.w3.org/2000/svg"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient id="textGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          <stop offset="0%" stopColor="rgba(100, 116, 139, 0.95)" />
          <stop offset="25%" stopColor="rgba(148, 163, 184, 0.85)" />
          <stop offset="50%" stopColor="rgba(203, 213, 225, 0.8)" />
          <stop offset="75%" stopColor="rgba(148, 163, 184, 0.85)" />
          <stop offset="100%" stopColor="rgba(100, 116, 139, 0.95)" />
        </linearGradient>
        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 40,
            mass: 0.5,
          }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)" />
        </mask>
      </defs>
    </svg>
  )
}

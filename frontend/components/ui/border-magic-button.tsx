"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface BorderMagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "primary" | "secondary"
  size?: "sm" | "md" | "lg"
}

export function BorderMagicButton({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}: BorderMagicButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  }

  const variantClasses = {
    default: "bg-slate-950 text-white",
    primary: "bg-slate-900 text-white",
    secondary: "bg-slate-950/80 text-slate-300",
  }

  return (
    <button
      className={cn(
        "relative inline-flex overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all duration-200 hover:scale-105",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#64748b_0%,#1e293b_50%,#64748b_100%)]" />
      <span
        className={cn(
          "inline-flex w-full cursor-pointer items-center justify-center rounded-full backdrop-blur-3xl font-medium transition-colors",
          sizeClasses[size],
          variantClasses[variant],
        )}
      >
        {children}
      </span>
    </button>
  )
}

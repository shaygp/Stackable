"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import SidebarDemo from "@/components/sidebar-demo"

interface ConditionalSidebarProps {
  children: React.ReactNode
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname()

  // Pages that should NOT have sidebar (landing page)
  const noSidebarPages = ["/"]

  // Check if current page should have sidebar
  const shouldShowSidebar = !noSidebarPages.includes(pathname)

  if (!shouldShowSidebar) {
    // Landing page - full width, no sidebar
    return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>
  }

  // App pages - with sidebar
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#0a0a0a] relative">
        <SidebarDemo />
        <main className="flex-1 overflow-auto bg-[#0a0a0a]">{children}</main>
      </div>
    </SidebarProvider>
  )
}

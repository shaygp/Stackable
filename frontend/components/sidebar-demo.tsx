"use client"

import { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { FaHome as Home, FaTerminal as Terminal, FaUser as User, FaSignOutAlt as LogOut, FaMicrochip as Cpu } from 'react-icons/fa'
import { motion } from "framer-motion"
import Link from "next/link"
import { useWallet } from '@/contexts/WalletContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SidebarDemo() {
  const { isAuthenticated, disconnect } = useWallet()
  const router = useRouter()
  const links = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5 shrink-0 text-white/70 group-hover/sidebar:text-white" />,
    },
    {
      label: "Terminal",
      href: "/terminal",
      icon: <Terminal className="h-5 w-5 shrink-0 text-white/70 group-hover/sidebar:text-white" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5 shrink-0 text-white/70 group-hover/sidebar:text-white" />,
    },
  ]

  const { open } = useSidebar()

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div className="border-t border-white/10 pt-4">
          {isAuthenticated && (
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 text-white/70 hover:text-white"
              onClick={async (e) => {
                e.preventDefault()
                disconnect()
                router.push('/')
              }}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logout
            </Button>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  )
}

export const Logo = () => {
  return (
    <Link href="/" className="relative z-20 flex items-center space-x-3 py-2 text-sm font-light text-white">
      <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
        <Cpu className="w-4 h-4 text-white" />
      </div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-light whitespace-pre text-white">
        Stackable
      </motion.span>
    </Link>
  )
}

export const LogoIcon = () => {
  return (
    <Link href="/" className="relative z-20 flex items-center space-x-2 py-2 text-sm font-light text-white">
      <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
        <Cpu className="w-4 h-4 text-white" />
      </div>
    </Link>
  )
}

import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ConditionalSidebar } from "@/components/conditional-sidebar"
import { WalletProvider } from "@/contexts/WalletContext"
import { Space_Grotesk, Orbitron } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: "Stackable - Launch & Trade Vibe Tokens with AI on Stacks",
  description: "The true way to use Bitcoin and DeFi is on Stacks. Launch and trade vibe tokens with AI — powered by Stacks, secured by Bitcoin",
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${orbitron.variable}`}>
        <WalletProvider>
          <ConditionalSidebar>{children}</ConditionalSidebar>
        </WalletProvider>
      </body>
    </html>
  )
}

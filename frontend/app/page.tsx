"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BorderMagicButton } from "@/components/ui/border-magic-button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Rocket,
  TrendingUp,
  Bot,
  ChevronDown,
  Github,
  Twitter,
  MessageCircle,
  Sparkles,
  Target,
  Crown,
  Medal,
  Cpu,
  Shield,
  Globe,
  Users,
} from "lucide-react"
import Link from "next/link"
import { HoverEffect } from "@/components/ui/card-hover-effect"
import BentoGridDemo from "@/components/bento-grid-demo"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"
import { WalletButton } from "@/components/WalletButton"
import { SpaceAnimations } from "@/components/SpaceAnimations"

export default function ElegantLandingPage() {
  const [typedText, setTypedText] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const prompts = ["Launch $MOULI", "Buy $DOGE for 10 STX", "Create $ROCKET token", "Trade $CYBER"]

  useEffect(() => {
    const prompt = prompts[currentPrompt]
    let i = 0
    const timer = setInterval(() => {
      if (i <= prompt.length) {
        setTypedText(prompt.slice(0, i))
        i++
      } else {
        setTimeout(() => {
          setCurrentPrompt((prev) => (prev + 1) % prompts.length)
          setTypedText("")
        }, 2000)
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [currentPrompt])

  const faqs = [
    {
      question: "How do I launch a token on Stackable?",
      answer:
        "Simply connect your Stacks wallet and use our terminal to create SIP-010 tokens. You can type commands like 'create token called MOON' or use our quick action buttons. The AI Agent will guide you through the entire process on the Stacks blockchain.",
    },
    {
      question: "What can I do with the AI Agent?",
      answer:
        "The AI Agent helps you deploy tokens, register .btc names via BNS, participate in pool stacking to earn BTC rewards, track your portfolio, and execute smart contract interactions - all through simple commands. No technical knowledge required!",
    },
    {
      question: "Why build on Stacks instead of other chains?",
      answer:
        "Stacks is a Bitcoin Layer 2 that anchors all transactions to Bitcoin, giving you Bitcoin's security with smart contract capabilities. You can earn real BTC rewards through stacking, register .btc names, and build DeFi apps secured by the most trusted blockchain.",
    },
    {
      question: "How does pool stacking work?",
      answer:
        "Pool stacking lets you earn BTC rewards even if you have less than 100k STX. Simply delegate your STX to a pool operator who combines it with others to meet the minimum threshold. You earn proportional BTC rewards based on your contribution.",
    },
  ]

  const projects = [
    {
      title: "SIP-010 TOKEN DEPLOYMENT",
      description:
        "Deploy fungible token contracts using SIP-010 trait standard. Includes transfer(), get-balance(), get-total-supply() functions. Mints initial supply to deployer address. Compatible with DeFi protocols on Stacks.",
      link: "/terminal",
    },
    {
      title: "BNS NAME REGISTRATION",
      description:
        "Register .btc namespace domains via ST000000000000000000002AMW42H.bns contract. Two-step process: name-preorder with hash160(name+salt), then name-register. Names anchor to Bitcoin via OP_RETURN.",
      link: "/terminal",
    },
    {
      title: "POX-4 POOL STACKING",
      description:
        "Delegate STX via delegate-stx() function to pool operators. No minimum threshold. Pool operators call delegate-stack-stx() to lock delegated STX and earn BTC rewards through Proof of Transfer consensus.",
      link: "/terminal",
    },
    {
      title: "STX TRANSFER & BALANCE",
      description:
        "Execute STX token transfers with optional memo field. Query balances via /v2/accounts API. Track locked STX from stacking, fungible tokens (SIP-010), and NFTs (SIP-009) in real-time.",
      link: "/terminal",
    },
    {
      title: "CONTRACT STATE READER",
      description:
        "Call read-only functions on any deployed Clarity contract via /v2/contracts/call-read. Query PoX info, token balances, BNS names. Returns Clarity values as JSON for integration.",
      link: "/terminal",
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Space Animations */}
      <SpaceAnimations />

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF5500] to-[#DD4400] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,85,0,0.3)]">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-orbitron font-bold text-[#FF5500] tracking-wider">STACKABLE</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link-elegant">
                Features
              </a>
              <a href="#tokens" className="nav-link-elegant">
                Tokens
              </a>
              <a href="#faq" className="nav-link-elegant">
                FAQ
              </a>
            </div>

            {/* Wallet Button (replaces CTA) */}
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Subtle Background Elements */}
      <div className="subtle-glow w-96 h-96 top-32 -right-48" />
      <div className="subtle-glow w-64 h-64 bottom-32 -left-32" />
      <div className="subtle-glow w-48 h-48 top-1/2 left-1/4" />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32">
        <div className="container mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            {/* Interactive Text Effect */}
            <div className="mb-12">
              <TextHoverEffect text="STACKABLE" />
            </div>

            {/* Hero Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-orbitron font-black mb-12 leading-tight rocket-launch">
              <span className="rocket-text">Launch & Trade</span>
              <br />
              <span className="text-[#FF5500] moon-glow">Vibe Tokens</span>
              <br />
              <span className="text-[#F7931A]">TO THE MOON 🚀</span>
            </h1>

            {/* Subtext */}
            <p className="text-xl md:text-2xl lg:text-3xl text-[#FF5500]/70 mb-20 max-w-3xl mx-auto leading-relaxed font-space">
              The true way to use{" "}
              <span className="text-[#F7931A] font-bold">Bitcoin</span> and{" "}
              <span className="text-[#FF5500] font-bold">DeFi</span> is on{" "}
              <span className="text-[#F7931A] font-bold">Stacks</span>. Today, you become a creator of this ecosystem 🌙
            </p>

            {/* Terminal Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex justify-center mb-20"
            >
              <div className="elegant-card p-8 max-w-md">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-400 font-normal text-sm">AI Copilot Active</p>
                    <p className="text-white/50 text-xs font-medium">Ready to assist your trading</p>
                  </div>
                </div>

                {/* Terminal Preview */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/5 font-mono">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-red-400/60 rounded-full" />
                    <div className="w-2 h-2 bg-yellow-400/60 rounded-full" />
                    <div className="w-2 h-2 bg-green-400/60 rounded-full" />
                    <span className="text-white/40 text-xs ml-2 font-medium">Stackable terminal</span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    <span className="text-slate-500">$</span> {typedText}
                    <span className="animate-pulse text-slate-400">|</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-24"
            >
              <Link href="/terminal">
                <BorderMagicButton variant="primary" className="group">
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  Try the Terminal
                </BorderMagicButton>
              </Link>
              <Link href="/terminal">
                <BorderMagicButton variant="secondary" className="group">
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Explore Trending Tokens
                </BorderMagicButton>
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-8">
              <span className="gradient-text-subtle">What Can You Do</span>
              <br />
              <span className="text-white/90">With Stackable?</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto font-normal">
              Unleash the power of AI-driven DeFi trading on the Stacks blockchain
            </p>
          </motion.div>

          <HoverEffect items={projects} />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 relative">
        <div className="container mx-auto px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-24">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-8">
              <span className="gradient-text-subtle">Frequently Asked</span>
              <br />
              <span className="text-white/90">Questions</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className="elegant-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/2 transition-colors rounded-lg"
                >
                  <h3 className="text-lg md:text-xl font-normal text-white/90">{faq.question}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-white/60 leading-relaxed text-base font-normal">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 relative">
        <div className="container mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-12 max-w-2xl mx-auto">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF5500] to-[#DD4400] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,85,0,0.3)]">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-orbitron font-bold text-[#FF5500] tracking-wider">STACKABLE</span>
              </div>
              <p className="text-white/50 mb-8 font-normal text-sm leading-relaxed">
                The future of DeFi trading powered by AI and built on Stacks blockchain.
              </p>
            </div>

            {/* Project */}
            <div>
              <h4 className="text-white/90 font-normal mb-8 text-sm">Navigation</h4>
              <ul className="space-y-4 text-white/50 text-sm font-normal">
                <li>
                  <Link href="/terminal" className="hover:text-slate-400 transition-colors">
                    Terminal
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="hover:text-slate-400 transition-colors">
                    Leaderboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-16 pt-8 text-center">
            <p className="text-white/40 text-sm font-normal">
              &copy; 2024 Stackable. Built with care for the future of DeFi
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

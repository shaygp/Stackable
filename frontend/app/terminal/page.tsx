"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BorderMagicButton } from "@/components/ui/border-magic-button"
import { Input } from "@/components/ui/input"
import {
  FaPaperPlane as Send,
  FaChartLine as TrendingUp,
  FaChartBar as TrendingDown,
  FaCoins as Coins,
  FaRocket as Rocket,
  FaGamepad as Gamepad2,
  FaCrown as Crown,
  FaFire as Flame,
  FaStar as Star,
  FaTrophy as Trophy,
  FaRobot as Robot,
} from "react-icons/fa"
import { useWallet } from "@/contexts/WalletContext"
import { openContractCall } from '@stacks/connect'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { stringAsciiCV, uintCV, PostConditionMode } from '@stacks/transactions'
import { executeSwap } from '@/lib/dex-integration'

interface Message {
  id: string
  type: "user" | "system" | "success" | "error"
  content: string
  timestamp: Date
}

interface UserStats {
  level: number
  totalTrades: number
  winRate: number
  portfolio: number
  achievements: string[]
  streak: number
}

interface TrendingToken {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: string
  marketCap: string
}

interface ActionTemplate {
  id: string
  title: string
  description: string
  icon: any
  command: string
  params?: { name: string; placeholder: string; default?: string }[]
}

export default function TerminalPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system",
      content: "🤖 Welcome to AI-Powered Trading Terminal\n\nSelect an action below and the AI agent will execute it autonomously on the Stacks blockchain.",
      timestamp: new Date(),
    },
  ])
  const [selectedAction, setSelectedAction] = useState<ActionTemplate | null>(null)
  const [actionParams, setActionParams] = useState<Record<string, string>>({})
  const [isExecuting, setIsExecuting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { isAuthenticated, userSession } = useWallet()

  const actionTemplates: ActionTemplate[] = [
    {
      id: 'launch',
      title: '🚀 Launch Token',
      description: 'Create a new bonding curve token',
      icon: Rocket,
      command: 'launch',
      params: [
        { name: 'symbol', placeholder: 'Token symbol (e.g., SATOSHI)', default: 'MEME' }
      ]
    },
    {
      id: 'buy',
      title: '💰 Buy Token',
      description: 'Buy tokens with STX',
      icon: Coins,
      command: 'buy',
      params: [
        { name: 'token', placeholder: 'Token symbol', default: 'SATOSHI' },
        { name: 'amount', placeholder: 'Amount in STX', default: '10' }
      ]
    },
    {
      id: 'swap',
      title: '🔄 Swap on ALEX',
      description: 'Swap tokens on ALEX DEX',
      icon: TrendingUp,
      command: 'swap',
      params: [
        { name: 'amount', placeholder: 'Amount to swap', default: '10' },
        { name: 'from', placeholder: 'From token', default: 'STX' },
        { name: 'to', placeholder: 'To token', default: 'ALEX' }
      ]
    },
    {
      id: 'sell',
      title: '💸 Sell Token',
      description: 'Sell your tokens',
      icon: TrendingDown,
      command: 'sell',
      params: [
        { name: 'token', placeholder: 'Token symbol', default: 'SATOSHI' },
        { name: 'amount', placeholder: 'Amount to sell', default: '100' }
      ]
    }
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const executeAction = async (action: ActionTemplate, params: Record<string, string>) => {
    setIsExecuting(true)

    // Build command from template
    let command = ''
    if (action.id === 'launch') {
      command = `launch ${params.symbol || 'MEME'}`
    } else if (action.id === 'buy') {
      command = `buy ${params.token || 'SATOSHI'} for ${params.amount || '10'} STX`
    } else if (action.id === 'swap') {
      command = `swap ${params.amount || '10'} ${params.from || 'STX'} for ${params.to || 'ALEX'} on alex`
    } else if (action.id === 'sell') {
      command = `sell ${params.amount || '100'} ${params.token || 'SATOSHI'}`
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `Executing: ${action.title}\n${command}`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "🤖 AI Agent is executing your request...",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, processingMessage])

      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()

      if (data.success) {
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "success",
          content: `✅ ${data.message}\n\nTransaction ID: ${data.txId}\nAgent Address: ${data.agentAddress}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, successMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "error",
          content: `❌ ${data.message}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to execute'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsExecuting(false)
      setSelectedAction(null)
      setActionParams({})
    }
  }

  const handleAgentCommand = async (command: string) => {
    try {
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "🤖 AI Agent is processing your command...",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, processingMessage])

      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      const data = await response.json()

      if (data.success) {
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "success",
          content: `✅ ${data.message}\n\nTransaction ID: ${data.txId}\nAgent Address: ${data.agentAddress}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, successMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: "error",
          content: `❌ ${data.message}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: `❌ Agent error: ${error instanceof Error ? error.message : 'Failed to execute command'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")

    // If in agent mode, use AI agent
    if (agentMode) {
      await handleAgentCommand(currentInput)
      return
    }

    // Wallet mode - require authentication
    if (!isAuthenticated) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: "Please connect your wallet to execute transactions in Wallet Mode, or switch to Agent Mode",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const lowerInput = currentInput.toLowerCase()

    try {
      if (lowerInput.includes("launch") || lowerInput.includes("create")) {
        const symbolMatch = currentInput.match(/\$?(\w+)/)
        if (symbolMatch) {
          const symbol = symbolMatch[1].toUpperCase()

          const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
            ? new StacksMainnet()
            : new StacksTestnet()

          const contractAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || ''

          const processingMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `Launching token $${symbol}. Check your wallet to confirm.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, processingMessage])

          await openContractCall({
            network,
            contractAddress,
            contractName: 'bonding-curve',
            functionName: 'launch-token',
            functionArgs: [
              stringAsciiCV(symbol),
              uintCV(100),
              uintCV(0),
              uintCV(1000),
              uintCV(1000000),
              uintCV(10000000),
            ],
            postConditionMode: PostConditionMode.Allow,
            onFinish: (data) => {
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "success",
                content: `Token $${symbol} launched successfully!`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, successMessage])
            },
            onCancel: () => {
              const cancelMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "error",
                content: "Transaction cancelled",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, cancelMessage])
            },
          })
        }
      } else if (lowerInput.includes("buy")) {
        const tokenMatch = currentInput.match(/\$(\w+)/)
        const amountMatch = currentInput.match(/(\d+(?:\.\d+)?)\s*stx/i)

        if (tokenMatch && amountMatch) {
          const token = tokenMatch[1].toUpperCase()
          const amount = parseFloat(amountMatch[1])

          const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
            ? new StacksMainnet()
            : new StacksTestnet()

          const contractAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || ''

          const processingMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `Buying $${token} for ${amount} STX. Check your wallet to confirm.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, processingMessage])

          await openContractCall({
            network,
            contractAddress,
            contractName: 'bonding-curve',
            functionName: 'buy-token',
            functionArgs: [
              stringAsciiCV(token),
              uintCV(Math.floor(amount * 1000000)),
              uintCV(100),
            ],
            postConditionMode: PostConditionMode.Allow,
            onFinish: (data) => {
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "success",
                content: `Successfully bought $${token}!`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, successMessage])
            },
            onCancel: () => {
              const cancelMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "error",
                content: "Transaction cancelled",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, cancelMessage])
            },
          })
        }
      } else if (lowerInput.includes("sell")) {
        const tokenMatch = currentInput.match(/\$(\w+)/)
        const amountMatch = currentInput.match(/(\d+(?:\.\d+)?)/)

        if (tokenMatch && amountMatch) {
          const token = tokenMatch[1].toUpperCase()
          const amount = parseFloat(amountMatch[1])

          const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
            ? new StacksMainnet()
            : new StacksTestnet()

          const contractAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || ''

          const processingMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `Selling ${amount} $${token}. Check your wallet to confirm.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, processingMessage])

          await openContractCall({
            network,
            contractAddress,
            contractName: 'bonding-curve',
            functionName: 'sell-token',
            functionArgs: [
              stringAsciiCV(token),
              uintCV(Math.floor(amount)),
              uintCV(1),
            ],
            postConditionMode: PostConditionMode.Allow,
            onFinish: (data) => {
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "success",
                content: `Successfully sold $${token}!`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, successMessage])
            },
            onCancel: () => {
              const cancelMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "error",
                content: "Transaction cancelled",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, cancelMessage])
            },
          })
        }
      } else if (lowerInput.includes("swap") && lowerInput.includes("alex")) {
        // Parse swap command: "swap X STX for ALEX" or "swap X ALEX for STX"
        const swapMatch = currentInput.match(/swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+for\s+(\w+)/i)

        if (swapMatch) {
          const amount = parseFloat(swapMatch[1])
          const fromToken = swapMatch[2].toUpperCase()
          const toToken = swapMatch[3].toUpperCase()

          const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'

          const processingMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `Swapping ${amount} ${fromToken} for ${toToken} on ALEX. Check your wallet to confirm.`,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, processingMessage])

          await executeSwap(
            {
              dex: 'alex',
              fromToken,
              toToken,
              amountIn: amount,
              minAmountOut: amount * 0.995, // 0.5% slippage tolerance
              isMainnet,
            },
            (data) => {
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "success",
                content: `Successfully swapped ${amount} ${fromToken} for ${toToken} on ALEX!`,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, successMessage])
            },
            () => {
              const cancelMessage: Message = {
                id: (Date.now() + 2).toString(),
                type: "error",
                content: "Transaction cancelled",
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, cancelMessage])
            }
          )
        } else {
          const helpMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: "Invalid swap command format. Example:\n• swap 10 STX for ALEX on alex\n• swap 5 ALEX for STX on alex",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, helpMessage])
        }
      } else if (lowerInput.includes("swap") && lowerInput.includes("velar")) {
        const infoMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: "Velar DEX integration coming soon! For now, use:\n• swap X STX for ALEX on alex\n\nOr visit app.velar.co to trade on Velar directly.",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, infoMessage])
      } else if (lowerInput.includes("deploy")) {
        const deployMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: "Visit /templates to deploy contracts:\n• Bonding Curve Token\n• Staking Pool\n• Liquidity Pool (AMM)\n• Multi-Sig Treasury",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, deployMessage])
      } else {
        const helpMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: "Available commands:\n• launch $TOKEN - Create new bonding curve token\n• buy $TOKEN for X STX - Buy tokens\n• sell X $TOKEN - Sell tokens\n• swap X STX for ALEX on alex - Trade on ALEX DEX\n• swap X ALEX for STX on alex - Trade on ALEX DEX\n• swap on velar - Trade on Velar DEX (coming soon)\n• deploy contract - Deploy smart contracts from templates",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, helpMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: `Error: ${error instanceof Error ? error.message : 'Transaction failed'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const quickCommands = [
    { label: "Buy $SATOSHI", command: "buy $SATOSHI for 10 STX", icon: TrendingUp },
    { label: "Launch Token", command: "launch $MYMEME", icon: Rocket },
    { label: "Swap on ALEX", command: "swap 10 STX for ALEX on alex", icon: Coins },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="subtle-glow w-96 h-96 top-20 -right-48" />
      <div className="subtle-glow w-64 h-64 bottom-20 -left-32" />

      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="border-b border-white/10 p-6">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Stacks Trading Terminal</h1>
                  <p className="text-sm text-slate-400">Always trust the Power of Bitcoin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`${index > 0 ? "border-t border-white/5 pt-8" : ""}`}
                  >
                    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-4xl ${message.type === "user" ? "ml-auto" : ""}`}>
                        {message.type === "user" && (
                          <div className="flex items-center gap-3 mb-4 justify-end">
                            <span className="text-sm text-slate-400 font-medium">You</span>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center">
                              <Gamepad2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        <div className={`${message.type === "user" ? "text-right" : "text-left"}`}>
                          <div
                            className={`inline-block p-4 rounded-2xl ${
                              message.type === "user"
                                ? "bg-gradient-to-r from-orange-600/20 to-orange-500/20 border border-orange-500/30"
                                : message.type === "success"
                                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                                  : message.type === "error"
                                    ? "bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30"
                                    : "bg-slate-900/50 border border-slate-700"
                            }`}
                          >
                            <p className="text-white/90 font-medium leading-relaxed whitespace-pre-line">
                              {message.content}
                            </p>
                          </div>
                          <p className="text-xs text-white/30 mt-2 font-light">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="px-4 lg:px-8 py-6 border-t border-white/10">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((cmd, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setInput(cmd.command)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/50 border border-orange-500/30 rounded-lg text-sm text-slate-300 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <cmd.icon className="w-4 h-4" />
                    {cmd.label}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your command... (e.g., 'buy $SATOSHI for 10 STX')"
                  className="elegant-input flex-1 text-lg py-6 bg-slate-900/30 border-orange-500/30"
                />
                <BorderMagicButton
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  size="lg"
                  variant="primary"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Execute
                </BorderMagicButton>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 border-l border-white/10 bg-slate-950/50 backdrop-blur-xl p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Trending Now</h3>
              </div>
              <div className="space-y-3">
                {trendingTokens.length > 0 ? (
                  trendingTokens.map((token) => (
                    <motion.div
                      key={token.symbol}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setInput(`buy $${token.symbol} for 10 STX`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">${token.symbol}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              token.change24h > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {token.change24h > 0 ? "+" : ""}
                            {token.change24h}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">${token.price}</p>
                      </div>
                      {token.change24h > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Launch tokens to see them trending</p>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Achievements</h3>
              </div>
              <div className="space-y-2">
                {userStats.achievements.length > 0 ? (
                  userStats.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-slate-300">
                      <Star className="w-3 h-3 text-orange-400" />
                      {achievement}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No achievements yet</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <BorderMagicButton onClick={() => setInput("launch $MYTOKEN")} className="w-full" size="sm">
                <Coins className="w-4 h-4 mr-2" />
                Launch Token
              </BorderMagicButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

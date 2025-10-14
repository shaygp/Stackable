"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BorderMagicButton } from "@/components/ui/border-magic-button"
import { Badge } from "@/components/ui/badge"
import {
  FaCode as Code,
  FaRocket as Rocket,
  FaCoins as Coins,
  FaLock as Lock,
  FaChartLine as TrendingUp,
} from "react-icons/fa"
import { useWallet } from "@/contexts/WalletContext"
import { openContractDeploy } from "@stacks/connect"
import { StacksTestnet, StacksMainnet } from "@stacks/network"

interface ContractTemplate {
  id: string
  name: string
  description: string
  icon: any
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  features: string[]
  codeUrl: string
  documentation: string
}

export default function TemplatesPage() {
  const { isAuthenticated } = useWallet()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)

  const templates: ContractTemplate[] = [
    {
      id: "bonding-curve",
      name: "Bonding Curve Token",
      description: "Launch tokens with automated pricing using bonding curves. Includes linear, exponential, and sigmoid curves.",
      icon: Rocket,
      category: "Token Launch",
      difficulty: "Advanced",
      features: [
        "Multiple curve types",
        "Automated market making",
        "Fee collection",
        "Graduation to DEX",
        "Trade history tracking"
      ],
      codeUrl: "https://github.com/shaygp/Stackable/blob/main/contracts/bonding-curve.clar",
      documentation: "Create your own token launchpad with bonding curve mechanics"
    },
    {
      id: "staking-pool",
      name: "Staking Pool",
      description: "Allow users to stake tokens and earn rewards over time with configurable parameters.",
      icon: Coins,
      category: "DeFi",
      difficulty: "Intermediate",
      features: [
        "Stake tokens",
        "Earn rewards",
        "Cooldown periods",
        "Admin controls",
        "Reward rate adjustment"
      ],
      codeUrl: "https://github.com/shaygp/Stackable/blob/main/contracts/staking-pool.clar",
      documentation: "Deploy a staking pool for your community"
    },
    {
      id: "liquidity-pool",
      name: "Liquidity Pool (AMM)",
      description: "Automated market maker for token swaps with constant product formula.",
      icon: TrendingUp,
      category: "DeFi",
      difficulty: "Advanced",
      features: [
        "Add/remove liquidity",
        "Token swaps",
        "LP tokens",
        "Fee collection",
        "Slippage protection"
      ],
      codeUrl: "https://github.com/shaygp/Stackable/blob/main/contracts/liquidity-pool.clar",
      documentation: "Create your own DEX liquidity pool"
    },
    {
      id: "treasury",
      name: "Multi-Sig Treasury",
      description: "Multi-signature treasury with timelock for secure fund management.",
      icon: Lock,
      category: "Governance",
      difficulty: "Intermediate",
      features: [
        "Multi-sig approvals",
        "Timelock delays",
        "Proposal system",
        "Signer management",
        "Spending controls"
      ],
      codeUrl: "https://github.com/shaygp/Stackable/blob/main/contracts/treasury.clar",
      documentation: "Manage community funds securely"
    }
  ]

  const handleDeploy = async (template: ContractTemplate) => {
    if (!isAuthenticated) {
      alert("Please connect your wallet first")
      return
    }

    setDeploying(true)
    setSelectedTemplate(template.id)

    try {
      const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
        ? new StacksMainnet()
        : new StacksTestnet()

      // Fetch the contract code
      const response = await fetch(`/api/contracts/${template.id}`)
      const contractCode = await response.text()

      await openContractDeploy({
        network,
        contractName: `${template.id}-${Date.now()}`,
        codeBody: contractCode,
        onFinish: (data) => {
          alert(`Contract deployed successfully! TX: ${data.txId}`)
          setDeploying(false)
          setSelectedTemplate(null)
        },
        onCancel: () => {
          setDeploying(false)
          setSelectedTemplate(null)
        },
      })
    } catch (error) {
      console.error("Deployment error:", error)
      alert("Failed to deploy contract. Check console for details.")
      setDeploying(false)
      setSelectedTemplate(null)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="subtle-glow w-96 h-96 top-20 -right-48" />
      <div className="subtle-glow w-64 h-64 bottom-20 -left-32" />

      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-8 md:pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium mb-4 md:mb-6">
            <span className="gradient-text-subtle">Contract</span> <span className="text-white/90">Templates</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/60 font-medium max-w-3xl mx-auto">
            Deploy powerful smart contracts to the Stacks blockchain from your wallet
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
          {templates.map((template, index) => {
            const Icon = template.icon
            const isDeploying = deploying && selectedTemplate === template.id

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="elegant-card p-6 md:p-8 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-slate-600/20 text-slate-300 border-slate-500/20">
                    {template.difficulty}
                  </Badge>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-medium text-white/95 mb-2">{template.name}</h3>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 mb-4">
                    {template.category}
                  </Badge>
                  <p className="text-white/60 font-medium leading-relaxed">{template.description}</p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white/80 mb-3">Features</h4>
                  <ul className="space-y-2">
                    {template.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <BorderMagicButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => handleDeploy(template)}
                    disabled={isDeploying || !isAuthenticated}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {isDeploying ? "Deploying..." : "Deploy Contract"}
                  </BorderMagicButton>
                  <BorderMagicButton
                    variant="secondary"
                    onClick={() => window.open(template.codeUrl, "_blank")}
                  >
                    View Code
                  </BorderMagicButton>
                </div>

                {!isAuthenticated && (
                  <p className="text-xs text-orange-400 mt-3 text-center">
                    Connect wallet to deploy
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* DEX Integration Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="elegant-card p-6 md:p-8">
            <h2 className="text-2xl font-medium text-white/95 mb-4">Trade on Stacks DEXes</h2>
            <p className="text-white/60 font-medium mb-6">
              Use the terminal to trade on popular Stacks decentralized exchanges like ALEX and Velar
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-sm font-semibold text-white/90 mb-2">ALEX</h3>
                <p className="text-xs text-white/60">Leading Stacks DEX with deep liquidity</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-sm font-semibold text-white/90 mb-2">Velar</h3>
                <p className="text-xs text-white/60">Modern DEX with concentrated liquidity</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-sm font-semibold text-white/90 mb-2">Bonding Curves</h3>
                <p className="text-xs text-white/60">Trade directly on bonding curve tokens</p>
              </div>
            </div>

            <BorderMagicButton variant="primary" onClick={() => window.location.href = "/terminal"}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Open Trading Terminal
            </BorderMagicButton>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

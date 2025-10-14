"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AICopilot } from "@/components/ai-copilot"
import { FaArrowLeft as ArrowLeft, FaChartLine as TrendingUp, FaShareAlt as Share2, FaHeart as Heart } from "react-icons/fa"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { time: "00:00", price: 0.08 },
  { time: "04:00", price: 0.082 },
  { time: "08:00", price: 0.085 },
  { time: "12:00", price: 0.088 },
  { time: "16:00", price: 0.086 },
  { time: "20:00", price: 0.089 },
  { time: "24:00", price: 0.091 },
]

export default function DogeTokenPage() {
  const [promptInput, setPromptInput] = useState("")
  const [copilotMessage, setCopilotMessage] = useState("DOGE is showing strong momentum! 🚀 Volume up 25% today.")

  const tokenData = {
    symbol: "DOGE",
    name: "Dogecoin",
    price: "$0.091",
    change: "+12.5%",
    volume: "2.1M APT",
    marketCap: "$12.8B",
    holders: "4,521",
    creator: "Community",
    description: "The original meme coin that started it all. Much wow, very crypto!",
  }

  const handlePromptSubmit = () => {
    if (!promptInput.trim()) return

    // Simulate AI response
    if (promptInput.toLowerCase().includes("buy")) {
      setCopilotMessage(`🚀 Processing buy order for ${tokenData.symbol}! Checking liquidity...`)
    } else if (promptInput.toLowerCase().includes("sell")) {
      setCopilotMessage(`📈 Sell order received for ${tokenData.symbol}. Finding best price...`)
    } else {
      setCopilotMessage(`Got it! Processing your request: "${promptInput}"`)
    }

    setPromptInput("")
  }

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <div className="border-b border-purple-500/20 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/terminal">
              <Button variant="ghost" size="sm" className="text-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Terminal
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-cyber font-bold text-purple-300">{tokenData.symbol}</h1>
              <p className="text-gray-400">{tokenData.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-purple-300">
                Home
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="border-purple-500 text-purple-300 bg-transparent">
              <Heart className="w-4 h-4 mr-2" />
              Favorite
            </Button>
            <Button variant="outline" size="sm" className="border-purple-500 text-purple-300 bg-transparent">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price & Stats */}
            <Card className="cyber-card">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Price</p>
                    <p className="text-2xl font-mono font-bold text-white">{tokenData.price}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">24h Change</p>
                    <p className="text-xl font-mono font-bold text-green-400 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {tokenData.change}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Volume</p>
                    <p className="text-xl font-mono font-bold text-purple-300">{tokenData.volume}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                    <p className="text-xl font-mono font-bold text-white">{tokenData.marketCap}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300">Price Chart (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                      <XAxis dataKey="time" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Token Info */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300">Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Creator</p>
                    <p className="font-mono text-purple-300">{tokenData.creator}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Holders</p>
                    <p className="font-mono text-white">{tokenData.holders}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Description</p>
                  <p className="text-white">{tokenData.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Copilot */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center gap-2">AI Copilot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AICopilot message={copilotMessage} size="sm" />

                <div className="space-y-2">
                  <Input
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={`Buy ${tokenData.symbol} for 2 APT`}
                    className="terminal-input"
                    onKeyPress={(e) => e.key === "Enter" && handlePromptSubmit()}
                  />
                  <Button onClick={handlePromptSubmit} className="cyber-button w-full" disabled={!promptInput.trim()}>
                    Execute Command
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setPromptInput(`Buy ${tokenData.symbol} for 10 APT`)}
                >
                  Buy {tokenData.symbol}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
                  onClick={() => setPromptInput(`Sell all ${tokenData.symbol}`)}
                >
                  Sell {tokenData.symbol}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-purple-500 text-purple-300 bg-transparent"
                  onClick={() => setPromptInput(`Set price alert for ${tokenData.symbol}`)}
                >
                  Set Price Alert
                </Button>
              </CardContent>
            </Card>

            {/* Social Share */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-purple-300">Share Token</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 p-4 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-gray-300 mb-2">🚀 Just discovered {tokenData.symbol} on @promptfun!</p>
                  <p className="text-sm text-gray-300 mb-3">
                    Price: {tokenData.price} ({tokenData.change}) 📈
                  </p>
                  <Button size="sm" className="cyber-button w-full">
                    Share on Twitter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

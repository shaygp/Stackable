"use client"

import type React from "react"
import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Rocket,
  TrendingUp,
  Zap,
  Star,
  Trophy,
  Target,
  Coins,
  ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  FlameIcon as Fire,
  Users,
  DollarSign,
  BarChart3,
} from "lucide-react"
import Image from "next/image"
import { BorderMagicButton } from "@/components/ui/border-magic-button";

export default function MemeTokenLauncher() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [description, setDescription] = useState("")
  const [totalSupply, setTotalSupply] = useState("")
  const [launchProgress, setLaunchProgress] = useState(0)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLaunchToken = () => {
    // Simulate launch progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setLaunchProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 200)
  }

  const trendingTokens = [
    { symbol: "$PEPE", price: "$0.0012", change: "+45.2%", volume: "2.1M" },
    { symbol: "$DOGE", price: "$0.067", change: "-2.1%", volume: "15.3M" },
    { symbol: "$SHIB", price: "$0.000008", change: "+12.7%", volume: "8.9M" },
    { symbol: "$FLOKI", price: "$0.00015", change: "+8.3%", volume: "3.2M" },
  ]

  return (
    <div className="min-h-screen relative">
      {/* Subtle background glows */}
      <div className="subtle-glow w-96 h-96 top-20 left-20 opacity-30"></div>
      <div className="subtle-glow w-80 h-80 bottom-40 right-32 opacity-20"></div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 elegant-card border-r border-border/50 flex flex-col items-center py-4 space-y-4 rounded-none z-10">
        <div className="w-8 h-8 bg-gradient-to-r from-primary/20 to-accent-text/20 rounded-lg flex items-center justify-center border border-border/30">
          <Rocket className="w-4 h-4 text-accent-text" />
        </div>
        <div className="w-8 h-8 elegant-button p-0 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="w-8 h-8 elegant-button p-0 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
          <Coins className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="w-8 h-8 elegant-button p-0 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-16 p-4 sm:p-6 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-accent-text/20 rounded-xl flex items-center justify-center border border-border/30">
              <Sparkles className="w-6 h-6 text-accent-text" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text-subtle text-dynamic-bold">Meme Token Launcher</h1>
              <p className="text-muted-foreground text-dynamic">AI-Powered Meme Token Factory</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-dynamic">
              <Trophy className="w-3 h-3 mr-1" />
              Level 12
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-dynamic">
              <Star className="w-3 h-3 mr-1" />
              2,450 XP
            </Badge>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-dynamic">
              <DollarSign className="w-3 h-3 mr-1" />
              $15,420
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Token Creation Form */}
          <div className="xl:col-span-2">
            <div className="elegant-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center text-dynamic-bold">
                  <Rocket className="w-5 h-5 mr-2 text-accent-text" />
                  Create Your Meme Token
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-secondary/50 border border-border/30">
                    <TabsTrigger
                      value="upload"
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-dynamic"
                    >
                      Upload Meme
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-dynamic"
                    >
                      Token Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="launch"
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-dynamic"
                    >
                      Launch
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/30 transition-colors elegant-card">
                      {uploadedImage ? (
                        <div className="space-y-4">
                          <Image
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded meme"
                            width={200}
                            height={200}
                            className="mx-auto rounded-lg object-cover border border-border/30"
                          />
                          <Button variant="outline" onClick={() => setUploadedImage(null)} className="elegant-button">
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-foreground mb-2 text-dynamic">Drop your meme here or click to upload</p>
                            <p className="text-sm text-muted-foreground text-dynamic-light">PNG, JPG, GIF up to 10MB</p>
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="meme-upload"
                          />
                          <Label htmlFor="meme-upload">
                            <BorderMagicButton className="w-full sm:w-auto">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Meme
                            </BorderMagicButton>
                          </Label>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="token-name" className="text-foreground text-dynamic">
                          Token Name
                        </Label>
                        <Input
                          id="token-name"
                          placeholder="e.g., Doge Coin"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                          className="elegant-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="token-symbol" className="text-foreground text-dynamic">
                          Token Symbol
                        </Label>
                        <Input
                          id="token-symbol"
                          placeholder="e.g., DOGE"
                          value={tokenSymbol}
                          onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                          className="elegant-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground text-dynamic">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Tell the world about your meme token..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="elegant-input min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total-supply" className="text-foreground text-dynamic">
                        Total Supply
                      </Label>
                      <Input
                        id="total-supply"
                        placeholder="e.g., 1000000000"
                        value={totalSupply}
                        onChange={(e) => setTotalSupply(e.target.value)}
                        className="elegant-input"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="launch" className="space-y-6">
                    <div className="elegant-card p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground text-dynamic-bold">Launch Preview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground text-dynamic-light">Token Name</p>
                          <p className="text-foreground font-medium text-dynamic">{tokenName || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground text-dynamic-light">Symbol</p>
                          <p className="text-foreground font-medium text-dynamic">{tokenSymbol || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground text-dynamic-light">Total Supply</p>
                          <p className="text-foreground font-medium text-dynamic">{totalSupply || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground text-dynamic-light">Network</p>
                          <p className="text-foreground font-medium text-dynamic">Ethereum</p>
                        </div>
                      </div>
                    </div>

                    {launchProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground text-dynamic">Launch Progress</span>
                          <span className="text-accent-text text-dynamic">{launchProgress}%</span>
                        </div>
                        <Progress value={launchProgress} className="bg-secondary" />
                      </div>
                    )}

                    <Button
                      onClick={handleLaunchToken}
                      disabled={!tokenName || !tokenSymbol || !uploadedImage || launchProgress > 0}
                      className="w-full elegant-button-primary py-3 text-dynamic-bold"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {launchProgress > 0 ? "Launching..." : "Launch Token"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 mt-8 xl:mt-0">
            {/* Level Progress */}
            <div className="elegant-card">
              <CardHeader>
                <CardTitle className="text-foreground text-sm text-dynamic-bold">Level Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground text-dynamic">Level 12</span>
                    <span className="text-foreground text-dynamic">2450 / 3000 XP</span>
                  </div>
                  <Progress value={81.6} className="bg-secondary" />
                </div>
              </CardContent>
            </div>

            {/* Trending Tokens */}
            <div className="elegant-card">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center text-dynamic-bold">
                  <Fire className="w-4 h-4 mr-2 text-orange-400" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-medium text-sm text-dynamic">{token.symbol}</p>
                      <p className="text-muted-foreground text-xs text-dynamic-light">{token.price}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center text-xs text-dynamic ${
                          token.change.startsWith("+") ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {token.change.startsWith("+") ? (
                          <ArrowUp className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDown className="w-3 h-3 mr-1" />
                        )}
                        {token.change}
                      </div>
                      <p className="text-muted-foreground text-xs text-dynamic-light">{token.volume}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </div>

            {/* Achievements */}
            <div className="elegant-card">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center text-dynamic-bold">
                  <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-foreground text-sm text-dynamic">Meme Master</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-foreground text-sm text-dynamic">Token Creator</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-accent-text" />
                  <span className="text-foreground text-sm text-dynamic">Community Builder</span>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
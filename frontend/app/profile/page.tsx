"use client"

import { motion } from "framer-motion"
import { BorderMagicButton } from "@/components/ui/border-magic-button"
import { Badge } from "@/components/ui/badge"
import { AICopilot } from "@/components/ai-copilot"
import {
  FaWallet as Wallet,
  FaTrophy as Trophy,
  FaHistory as History,
  FaCog as Settings,
  FaCopy as Copy,
  FaChartLine as TrendingUp,
  FaStar as Sparkles,
  FaBullseye as Target,
  FaBolt as Zap,
  FaStar as Star,
  FaCalendar as Calendar,
  FaAward as Award,
} from "react-icons/fa"
import { useWallet } from "@/contexts/WalletContext"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { isAuthenticated, userData } = useWallet()
  const router = useRouter()
  const walletAddress = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet || ""
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""

  const userProfile = {
    address: walletAddress,
    shortAddress: shortAddress,
    xp: 0,
    level: 0,
    rank: 0,
    badge: "New Trader",
    joinDate: "2025",
    totalVolume: "0 STX",
    tokensCreated: 0,
    tokensTraded: 0,
    winRate: "0%",
    streak: 0,
    nextLevelXP: 1000,
    achievements: 0,
    totalTrades: 0,
  }

  const createdTokens: any[] = []
  const recentActivity: any[] = []
  const achievements: any[] = []
  const quests: any[] = []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="subtle-glow w-96 h-96 top-20 -right-48" />
      <div className="subtle-glow w-64 h-64 bottom-20 -left-32" />
      <div className="subtle-glow w-48 h-48 top-1/2 left-1/4" />

      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-8 md:pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium mb-4 md:mb-6">
            <span className="gradient-text-subtle">Your</span> <span className="text-white/90">Profile</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/60 font-medium max-w-2xl mx-auto">
            Track your progress and achievements
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Profile Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="elegant-card p-4 md:p-6 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-500 rounded-full flex items-center justify-center text-3xl shrink-0">
                    🚀
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h2 className="text-2xl font-medium text-white/95">{userProfile.shortAddress}</h2>
                      <Badge className="bg-slate-600/20 text-slate-300 border-slate-500/20">{userProfile.badge}</Badge>
                      <BorderMagicButton className="p-2 h-8 w-8">
                        <Copy className="w-4 h-4" />
                      </BorderMagicButton>
                    </div>
                    <p className="text-white/60 font-mono text-sm mb-2 break-all">{userProfile.address}</p>
                    <div className="flex items-center gap-4 text-sm text-white/60 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Member since {userProfile.joinDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Level {userProfile.level}
                      </div>
                    </div>
                  </div>
                  <BorderMagicButton>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </BorderMagicButton>
                </div>

                {/* Level Progress */}
                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/90 font-medium">Level {userProfile.level} Progress</span>
                    <span className="text-sm text-white/60 font-medium">
                      {userProfile.xp}/{userProfile.nextLevelXP} XP
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-slate-600 to-slate-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(userProfile.xp / userProfile.nextLevelXP) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 font-medium">
                    {userProfile.nextLevelXP - userProfile.xp} XP to next level
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-2xl md:text-3xl font-medium accent-text mb-1">
                      {userProfile.xp.toLocaleString()}
                    </div>
                    <div className="text-sm text-white/60 font-medium">XP</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-2xl md:text-3xl font-medium text-white/90 mb-1">#{userProfile.rank}</div>
                    <div className="text-sm text-white/60 font-medium">Rank</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-2xl md:text-3xl font-medium text-white/90 mb-1">
                      {userProfile.tokensCreated}
                    </div>
                    <div className="text-sm text-white/60 font-medium">Tokens Created</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-2xl md:text-3xl font-medium text-green-400 mb-1">{userProfile.winRate}</div>
                    <div className="text-sm text-white/60 font-medium">Win Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Created Tokens */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="elegant-card p-4 md:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white/95">Your Tokens</h3>
                </div>
                <div className="space-y-4">
                  {createdTokens.length > 0 ? (
                    createdTokens.map((token, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="relative overflow-hidden p-4 md:p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">🪙</div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <div className="font-mono text-white/95 font-medium text-lg">{token.symbol}</div>
                                <Badge
                                  className={`text-xs font-medium ${
                                    token.status === "trending"
                                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                                      : "bg-white/10 text-white/80 border-white/20"
                                  }`}
                                >
                                  {token.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-white/60 font-medium">
                                <div>💰 {token.marketCap}</div>
                                <div>👥 {token.holders} holders</div>
                                <div>📊 {token.volume}</div>
                                <div>📅 {token.launched}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-white/95 text-lg mb-1">{token.price}</div>
                            <div
                              className={`text-sm font-medium ${
                                token.change.startsWith("+") ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {token.change}
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12" />
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-white/60 py-8">No tokens created yet. Launch your first token!</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="elegant-card p-4 md:p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium text-white/95">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                              activity.type === "launch"
                                ? "bg-blue-500/20 text-blue-400"
                                : activity.type === "buy"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {activity.type === "launch" ? "🚀" : activity.type === "buy" ? "📈" : "📉"}
                          </div>
                          <div>
                            <div className="text-sm text-white/95 font-medium">
                              {activity.action} <span className="accent-text font-mono">{activity.token}</span>
                            </div>
                            <div className="text-xs text-white/60 font-medium">{activity.amount}</div>
                          </div>
                        </div>
                        <div className="text-xs text-white/60 font-medium">{activity.time}</div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-white/60 py-8">No recent activity. Start trading to see your history!</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* AI Copilot */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <div className="elegant-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white/95">AI Copilot</h3>
                </div>
                <AICopilot message="Want to launch another token? The market is looking bullish! 🚀" size="sm" />
              </div>
            </motion.div>

            {/* Active Quests */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <div className="elegant-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white/95">Active Quests</h3>
                </div>
                <div className="space-y-4">
                  {quests.length > 0 ? (
                    quests.map((quest, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-white/95">{quest.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-600/20 text-slate-300 text-xs font-medium border-slate-500/20">
                              {quest.reward}
                            </Badge>
                            <span className="text-xs text-white/50 font-medium">{quest.timeLeft}</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/60 font-medium mb-3">{quest.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-slate-600 to-slate-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/60 font-mono font-medium">
                            {quest.progress}/{quest.total}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-white/60 py-4 text-sm">No active quests</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
              <div className="elegant-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white/95">Achievements</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.length > 0 ? (
                    achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className={`p-3 rounded-xl border text-center transition-all hover:scale-105 ${
                          achievement.unlocked
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-white/5 border-white/10 opacity-50"
                        }`}
                      >
                        <div className="text-2xl mb-2">{achievement.icon}</div>
                        <div className="text-xs font-medium text-white/90 mb-1">{achievement.title}</div>
                        <Badge
                          className={`text-xs ${
                            achievement.rarity === "Mythic"
                              ? "bg-red-500/20 text-red-400"
                              : achievement.rarity === "Legendary"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : achievement.rarity === "Epic"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : achievement.rarity === "Rare"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {achievement.rarity}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <p className="col-span-2 text-center text-white/60 py-4 text-sm">No achievements unlocked yet</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Wallet Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
              <div className="elegant-card p-4 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white/95">Wallet Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Total Volume</span>
                    <span className="font-mono accent-text font-medium">{userProfile.totalVolume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Total Trades</span>
                    <span className="font-mono text-white/90 font-medium">{userProfile.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Win Streak</span>
                    <span className="font-mono text-green-400 font-medium">🔥 {userProfile.streak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-medium">Achievements</span>
                    <span className="font-mono text-yellow-400 font-medium">🏆 {userProfile.achievements}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-3">
                  <BorderMagicButton variant="primary" className="w-full" onClick={() => router.push('/terminal')}>
                    <Zap className="w-4 h-4 mr-2" />
                    Launch New Token
                  </BorderMagicButton>
                  <BorderMagicButton variant="secondary" className="w-full" onClick={() => router.push('/terminal')}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Trading Terminal
                  </BorderMagicButton>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

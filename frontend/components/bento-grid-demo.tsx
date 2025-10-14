import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { FaRocket as Rocket, FaChartLine as TrendingUp, FaRobot as Bot, FaBolt as Zap, FaBullseye as Target, FaCrown as Crown, FaMedal as Medal } from "react-icons/fa"

export default function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  )
}

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-400/20"></div>
)

const items = [
  {
    title: "$MOULI Token",
    description: "Community-driven meme token with explosive growth potential.",
    header: <Skeleton />,
    icon: <Rocket className="h-4 w-4 text-cyan-400" />,
  },
  {
    title: "$CYBER Revolution",
    description: "Next-gen DeFi token powering the cyberpunk ecosystem.",
    header: <Skeleton />,
    icon: <Bot className="h-4 w-4 text-blue-400" />,
  },
  {
    title: "AI Trading Signals",
    description: "Get real-time insights from our advanced AI copilot.",
    header: <Skeleton />,
    icon: <TrendingUp className="h-4 w-4 text-cyan-400" />,
  },
  {
    title: "Lightning Fast Trades",
    description: "Execute trades instantly with our optimized smart contracts on Aptos.",
    header: <Skeleton />,
    icon: <Zap className="h-4 w-4 text-blue-400" />,
  },
  {
    title: "Earn XP & Rewards",
    description: "Level up your trading game and unlock exclusive benefits.",
    header: <Skeleton />,
    icon: <Target className="h-4 w-4 text-cyan-400" />,
  },
  {
    title: "Top Trader Leaderboard",
    description: "Compete with the best and climb the global rankings.",
    header: <Skeleton />,
    icon: <Crown className="h-4 w-4 text-blue-400" />,
  },
  {
    title: "Community Governance",
    description: "Shape the future of prompt.fun through decentralized voting and proposals.",
    header: <Skeleton />,
    icon: <Medal className="h-4 w-4 text-cyan-400" />,
  },
]

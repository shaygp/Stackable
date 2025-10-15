// Types for Claude Agent Transaction Parameters

export type NetworkType = 'testnet' | 'mainnet'

export type ActionType =
  | 'balance'
  | 'launch-token'
  | 'buy-token'
  | 'sell-token'
  | 'swap'
  | 'register-bns'
  | 'pool-stack'
  | 'direct-stack'
  | 'send-stx'
  | 'unknown'

export interface ClarityValue {
  type: string
  value: any
}

export interface TransactionParameters {
  contractAddress: string
  contractName: string
  functionName: string
  functionArgs: ClarityValue[]
  network: NetworkType
  postConditionMode?: 'allow' | 'deny'
  description: string
  estimatedCost?: string
  readOnly?: boolean
}

export interface BalanceQuery {
  action: 'balance'
  address?: string
  description: string
}

export interface ParsedCommand {
  action: ActionType
  confidence: number
  transactionParams?: TransactionParameters
  balanceQuery?: BalanceQuery
  message: string
  rawParams?: Record<string, any>
}

export interface LaunchTokenParams {
  symbol: string
  basePrice: number
  curveType: number
  slope: number
  graduationThreshold: number
  maxSupply: number
}

export interface BuyTokenParams {
  symbol: string
  amount: number
  maxSlippage: number
}

export interface SellTokenParams {
  symbol: string
  amount: number
  minReceived: number
}

export interface SwapParams {
  dex: 'alex' | 'velar'
  fromToken: string
  toToken: string
  amountIn: number
  minAmountOut: number
}

export interface BNSRegisterParams {
  name: string
  namespace: string
}

export interface PoolStackParams {
  amount: number
  poolAddress?: string
}

export interface DirectStackParams {
  amount: number
  btcAddress: string
  duration: number
}

export interface SendSTXParams {
  recipient: string
  amount: number
  memo?: string
}

import Anthropic from '@anthropic-ai/sdk'
import type {
  ParsedCommand,
  TransactionParameters,
  LaunchTokenParams,
  BuyTokenParams,
  SellTokenParams,
  SwapParams,
  BNSRegisterParams,
  PoolStackParams,
  DirectStackParams,
  SendSTXParams,
  ClarityValue,
  NetworkType,
} from './types'

const BONDING_CURVE_CONTRACT = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS
  ? `${process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS}.bonding-curve`
  : 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bonding-curve'

const BNS_CONTRACT = 'ST000000000000000000002AMW42H.bns'
const POX4_CONTRACT = 'ST000000000000000000002AMW42H.pox-4'

// ALEX DEX contracts
const ALEX_SWAP_CONTRACT = 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.swap-helper-v1-03'
const ALEX_TOKEN_WSTX = 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.token-wstx'
const ALEX_TOKEN_ALEX = 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.age000-governance-token'

export class ClaudeAgent {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async parseCommand(userInput: string, network: NetworkType = 'testnet'): Promise<ParsedCommand> {
    const systemPrompt = `You are an expert Stacks blockchain assistant that parses natural language commands into structured transaction parameters.

Your job is to analyze user commands and return a JSON object with transaction details that can be executed on the Stacks blockchain.

Available actions:
1. "balance" - Check STX and token balances (read-only)
2. "launch-token" - Deploy a new token with bonding curve
3. "buy-token" - Buy tokens from bonding curve
4. "sell-token" - Sell tokens to bonding curve
5. "swap" - Swap tokens on ALEX DEX
6. "register-bns" - Register .btc domain name
7. "pool-stack" - Delegate STX to stacking pool
8. "direct-stack" - Stack STX directly (requires 100k+ STX)
9. "send-stx" - Send STX to another address

Contract addresses on ${network}:
- Bonding Curve: ${BONDING_CURVE_CONTRACT}
- BNS: ${BNS_CONTRACT}
- PoX-4: ${POX4_CONTRACT}
- ALEX Swap: ${ALEX_SWAP_CONTRACT}

Response format:
{
  "action": "one of the actions above",
  "confidence": 0.0-1.0,
  "params": {
    // Action-specific parameters
  },
  "message": "Human-readable description of what will happen"
}

Parameter specifications:

launch-token:
- symbol: string (max 32 chars, uppercase)
- basePrice: number (in microSTX, default 1000000 = 1 STX)
- curveType: 0=linear, 1=exponential, 2=logarithmic, 3=sigmoid (default 0)
- slope: number (default 1000)
- graduationThreshold: number (STX needed to graduate, default 100000000000 = 100k STX)
- maxSupply: number (max tokens, default 1000000000000)

buy-token:
- symbol: string (token symbol)
- amount: number (number of tokens to buy)
- maxSlippage: number (max slippage in basis points, default 500 = 5%)

sell-token:
- symbol: string (token symbol)
- amount: number (number of tokens to sell)
- minReceived: number (min STX to receive in microSTX)

swap:
- dex: "alex" or "velar"
- fromToken: string (e.g., "STX", "ALEX")
- toToken: string (e.g., "ALEX", "STX")
- amountIn: number (amount in microunits)
- minAmountOut: number (min amount out in microunits)

register-bns:
- name: string (name without .btc)
- namespace: string (usually "btc")

pool-stack:
- amount: number (STX amount)
- poolAddress: string (optional pool operator address)

direct-stack:
- amount: number (min 100,000 STX)
- btcAddress: string (Bitcoin address for rewards)
- duration: number (number of cycles, default 1)

send-stx:
- recipient: string (Stacks address)
- amount: number (STX amount)
- memo: string (optional)

Examples:
- "show my balance" -> action: "balance"
- "launch a token called MOON" -> action: "launch-token", params: {symbol: "MOON", ...defaults}
- "buy 100 DOGE tokens" -> action: "buy-token", params: {symbol: "DOGE", amount: 100000000}
- "swap 5 STX for ALEX" -> action: "swap", params: {dex: "alex", fromToken: "STX", toToken: "ALEX", amountIn: 5000000}
- "register alice.btc" -> action: "register-bns", params: {name: "alice", namespace: "btc"}
- "stake 1000 STX in pool" -> action: "pool-stack", params: {amount: 1000000000}

Always use microunits (1 STX = 1,000,000 microSTX, 1 token = 1,000,000 micro-tokens).
Be generous with confidence scores for clear commands.
Provide helpful error messages for ambiguous commands.`

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userInput,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response format')
      }

      const parsed = JSON.parse(content.text)

      return this.convertToTransactionParams(parsed, network)
    } catch (error) {
      console.error('Claude parsing error:', error)
      return {
        action: 'unknown',
        confidence: 0,
        message: "I couldn't understand that command. Try something like 'show my balance' or 'buy 100 DOGE tokens'",
      }
    }
  }

  private convertToTransactionParams(parsed: any, network: NetworkType): ParsedCommand {
    const { action, params, confidence, message } = parsed

    if (action === 'balance') {
      return {
        action: 'balance',
        confidence: confidence || 0.9,
        balanceQuery: {
          action: 'balance',
          description: message || 'Fetching your balance...',
        },
        message: message || 'Fetching your balance...',
      }
    }

    let transactionParams: TransactionParameters | undefined

    switch (action) {
      case 'launch-token':
        transactionParams = this.buildLaunchTokenTx(params as LaunchTokenParams, network)
        break
      case 'buy-token':
        transactionParams = this.buildBuyTokenTx(params as BuyTokenParams, network)
        break
      case 'sell-token':
        transactionParams = this.buildSellTokenTx(params as SellTokenParams, network)
        break
      case 'swap':
        transactionParams = this.buildSwapTx(params as SwapParams, network)
        break
      case 'register-bns':
        transactionParams = this.buildBNSRegisterTx(params as BNSRegisterParams, network)
        break
      case 'pool-stack':
        transactionParams = this.buildPoolStackTx(params as PoolStackParams, network)
        break
      case 'direct-stack':
        transactionParams = this.buildDirectStackTx(params as DirectStackParams, network)
        break
      case 'send-stx':
        transactionParams = this.buildSendSTXTx(params as SendSTXParams, network)
        break
    }

    return {
      action,
      confidence: confidence || 0.7,
      transactionParams,
      message: message || 'Transaction prepared',
      rawParams: params,
    }
  }

  private buildLaunchTokenTx(params: LaunchTokenParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = BONDING_CURVE_CONTRACT.split('.')

    return {
      contractAddress,
      contractName,
      functionName: 'launch-token',
      functionArgs: [
        { type: 'string-ascii', value: params.symbol },
        { type: 'uint', value: params.basePrice || 1000000 },
        { type: 'uint', value: params.curveType || 0 },
        { type: 'uint', value: params.slope || 1000 },
        { type: 'uint', value: params.graduationThreshold || 100000000000 },
        { type: 'uint', value: params.maxSupply || 1000000000000 },
      ],
      network,
      description: `Launch token ${params.symbol} with bonding curve`,
      estimatedCost: '~0.5 STX (transaction fee)',
    }
  }

  private buildBuyTokenTx(params: BuyTokenParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = BONDING_CURVE_CONTRACT.split('.')

    return {
      contractAddress,
      contractName,
      functionName: 'buy-token',
      functionArgs: [
        { type: 'string-ascii', value: params.symbol },
        { type: 'uint', value: params.amount },
        { type: 'uint', value: params.maxSlippage || 500 },
      ],
      network,
      description: `Buy ${params.amount / 1000000} ${params.symbol} tokens from bonding curve`,
      estimatedCost: 'Variable based on bonding curve price',
    }
  }

  private buildSellTokenTx(params: SellTokenParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = BONDING_CURVE_CONTRACT.split('.')

    return {
      contractAddress,
      contractName,
      functionName: 'sell-token',
      functionArgs: [
        { type: 'string-ascii', value: params.symbol },
        { type: 'uint', value: params.amount },
        { type: 'uint', value: params.minReceived || 0 },
      ],
      network,
      description: `Sell ${params.amount / 1000000} ${params.symbol} tokens to bonding curve`,
      estimatedCost: 'Will receive STX based on bonding curve',
    }
  }

  private buildSwapTx(params: SwapParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = ALEX_SWAP_CONTRACT.split('.')

    return {
      contractAddress,
      contractName,
      functionName: 'swap-helper',
      functionArgs: [
        { type: 'principal', value: ALEX_TOKEN_WSTX },
        { type: 'principal', value: ALEX_TOKEN_ALEX },
        { type: 'uint', value: 100000000 }, // factor-x
        { type: 'uint', value: 100000000 }, // factor-y
        { type: 'uint', value: params.amountIn },
        { type: 'uint', value: params.minAmountOut || 0 },
      ],
      network,
      description: `Swap ${params.amountIn / 1000000} ${params.fromToken} for ${params.toToken} on ALEX`,
      estimatedCost: '~0.1 STX (transaction fee)',
    }
  }

  private buildBNSRegisterTx(params: BNSRegisterParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = BNS_CONTRACT.split('.')

    // For BNS registration, we need to hash the name
    // This is a simplified version - full implementation would require proper hashing
    const nameHash = Buffer.from(params.name).toString('hex').padEnd(40, '0')

    return {
      contractAddress,
      contractName,
      functionName: 'name-preorder',
      functionArgs: [
        { type: 'buffer', value: nameHash },
        { type: 'uint', value: 640000 }, // registration fee in microSTX
      ],
      network,
      description: `Register ${params.name}.${params.namespace} domain (step 1: preorder)`,
      estimatedCost: '~0.64 STX + transaction fee',
    }
  }

  private buildPoolStackTx(params: PoolStackParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = POX4_CONTRACT.split('.')
    const defaultPoolOperator = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'

    return {
      contractAddress,
      contractName,
      functionName: 'delegate-stx',
      functionArgs: [
        { type: 'uint', value: params.amount },
        { type: 'principal', value: params.poolAddress || defaultPoolOperator },
        { type: 'none', value: null }, // until-burn-ht
        { type: 'none', value: null }, // pox-addr
      ],
      network,
      description: `Delegate ${params.amount / 1000000} STX to stacking pool`,
      estimatedCost: '~0.01 STX (transaction fee)',
    }
  }

  private buildDirectStackTx(params: DirectStackParams, network: NetworkType): TransactionParameters {
    const [contractAddress, contractName] = POX4_CONTRACT.split('.')

    // Parse BTC address to get version and hashbytes
    // This is simplified - real implementation needs proper BTC address parsing
    const version = params.btcAddress.startsWith('bc1') ? '00' : '05'
    const hashbytes = params.btcAddress.substring(3).padEnd(40, '0')

    return {
      contractAddress,
      contractName,
      functionName: 'stack-stx',
      functionArgs: [
        { type: 'uint', value: params.amount },
        {
          type: 'tuple',
          value: {
            version: { type: 'buffer', value: version },
            hashbytes: { type: 'buffer', value: hashbytes },
          },
        },
        { type: 'uint', value: 0 }, // start-burn-ht
        { type: 'uint', value: params.duration || 1 },
      ],
      network,
      description: `Stack ${params.amount / 1000000} STX for ${params.duration || 1} cycle(s) to earn BTC`,
      estimatedCost: '~0.01 STX (transaction fee)',
    }
  }

  private buildSendSTXTx(params: SendSTXParams, network: NetworkType): TransactionParameters {
    // STX transfers are special - they don't use a contract call
    // We'll return a special marker that the frontend can handle
    return {
      contractAddress: 'STX_TRANSFER',
      contractName: 'native',
      functionName: 'transfer',
      functionArgs: [
        { type: 'principal', value: params.recipient },
        { type: 'uint', value: params.amount },
        { type: 'string-utf8', value: params.memo || '' },
      ],
      network,
      description: `Send ${params.amount / 1000000} STX to ${params.recipient.substring(0, 8)}...`,
      estimatedCost: '~0.001 STX (transaction fee)',
    }
  }
}

export function createClaudeAgent(): ClaudeAgent {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }
  return new ClaudeAgent(apiKey)
}

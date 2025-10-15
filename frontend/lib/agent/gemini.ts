import { GoogleGenerativeAI } from '@google/generative-ai'

export interface CommandIntent {
  action: 'stack' | 'send' | 'mint-nft' | 'bridge-btc' | 'tx-info' | 'deploy' | 'bns-register' | 'create-token' | 'pool-stack' | 'balance' | 'read-contract' | 'unknown'
  params: {
    amount?: number
    recipient?: string
    memo?: string
    btcAddress?: string
    duration?: number
    txid?: string
    nftName?: string
    nftUri?: string
    contractDescription?: string
    bnsName?: string
    namespace?: string
    tokenName?: string
    tokenSymbol?: string
    tokenSupply?: number
    poolAddress?: string
    contractAddress?: string
    functionName?: string
  }
  confidence: number
}

export class GeminiAgent {
  private genAI: GoogleGenerativeAI
  private model: any
  private proModel: any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
    this.proModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-002',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  }

  async parseCommand(userInput: string): Promise<CommandIntent> {
    const input = userInput.toLowerCase()

    if ((input.includes('register') || input.includes('claim')) && (input.includes('bns') || input.includes('.btc') || input.includes('name'))) {
      const nameMatch = userInput.match(/(?:register|claim)\s+([a-z0-9-]+)(?:\.btc)?/i)
      return {
        action: 'bns-register',
        params: {
          bnsName: nameMatch ? nameMatch[1] : undefined,
          namespace: 'btc'
        },
        confidence: nameMatch ? 0.9 : 0.6
      }
    }

    if ((input.includes('create') || input.includes('launch')) && (input.includes('token') || input.includes('sip-010') || input.includes('fungible'))) {
      const symbolMatch = userInput.match(/(?:symbol|ticker)\s+([A-Z]{2,5})/i) || userInput.match(/called\s+([A-Z]{2,5})/i)
      const supplyMatch = userInput.match(/(\d+(?:,\d+)*)\s*(?:total|supply|tokens)/i)

      return {
        action: 'create-token',
        params: {
          tokenSymbol: symbolMatch ? symbolMatch[1].toUpperCase() : undefined,
          tokenSupply: supplyMatch ? parseInt(supplyMatch[1].replace(/,/g, '')) : 1000000
        },
        confidence: symbolMatch ? 0.9 : 0.7
      }
    }

    if (input.includes('pool') && input.includes('stack')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*stx/i) || userInput.match(/(\d+(?:\.\d+)?)/)
      return {
        action: 'pool-stack',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : undefined
        },
        confidence: amountMatch ? 0.9 : 0.6
      }
    }

    if (input.includes('balance') || input.includes('holdings') || input.includes('portfolio')) {
      return {
        action: 'balance',
        params: {},
        confidence: 0.9
      }
    }

    if (input.includes('read') && input.includes('contract')) {
      const addressMatch = userInput.match(/(ST[A-Z0-9]+\.[a-z0-9-]+)/i)
      const functionMatch = userInput.match(/function\s+([a-z-]+)/i)

      return {
        action: 'read-contract',
        params: {
          contractAddress: addressMatch ? addressMatch[1] : undefined,
          functionName: functionMatch ? functionMatch[1] : undefined
        },
        confidence: addressMatch ? 0.9 : 0.5
      }
    }

    if (input.includes('stack') && !input.includes('stacks') && !input.includes('pool')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*stx/i) || userInput.match(/(\d+(?:\.\d+)?)/)
      const btcMatch = userInput.match(/(?:to|address)\s*(bc1[a-z0-9]+|[13][a-km-zA-HJ-NP-Z1-9]{25,34})/i)
      const durationMatch = userInput.match(/(\d+)\s*cycles?/i)

      return {
        action: 'stack',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
          btcAddress: btcMatch ? btcMatch[1] : undefined,
          duration: durationMatch ? parseInt(durationMatch[1]) : 1
        },
        confidence: amountMatch ? 0.9 : 0.6
      }
    }

    if (input.includes('send') || input.includes('transfer')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*stx/i) || userInput.match(/(\d+(?:\.\d+)?)/)
      const addressMatch = userInput.match(/to\s+(ST[A-Z0-9]+)/i) || userInput.match(/(ST[A-Z0-9]{38,})/i)

      return {
        action: 'send',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : 1,
          recipient: addressMatch ? addressMatch[1] : '',
          memo: 'AI agent transfer'
        },
        confidence: addressMatch ? 0.9 : 0.5
      }
    }

    if (input.includes('mint') && input.includes('nft')) {
      const nameMatch = userInput.match(/(?:called|named)\s+([A-Za-z0-9-]+)/i)

      return {
        action: 'mint-nft',
        params: {
          nftName: nameMatch ? nameMatch[1] : 'AI-NFT',
          nftUri: 'ipfs://placeholder'
        },
        confidence: 0.9
      }
    }

    if (input.includes('bridge') && input.includes('btc')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*btc/i)

      return {
        action: 'bridge-btc',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : undefined
        },
        confidence: amountMatch ? 0.9 : 0.5
      }
    }

    if (input.includes('transaction') || input.includes('tx info') || input.includes('check tx')) {
      const txMatch = userInput.match(/0x[a-fA-F0-9]{64}/)

      return {
        action: 'tx-info',
        params: {
          txid: txMatch ? txMatch[0] : undefined
        },
        confidence: txMatch ? 0.9 : 0.5
      }
    }

    if (input.includes('deploy')) {
      return {
        action: 'deploy',
        params: {
          contractDescription: userInput
        },
        confidence: 0.8
      }
    }

    return {
      action: 'unknown',
      params: {},
      confidence: 0
    }
  }

  async generateResponse(intent: CommandIntent, success: boolean, details?: string): Promise<string> {
    const prompt = `Generate a friendly, concise response for a crypto trading action.

Action: ${intent.action}
Success: ${success}
Details: ${details || 'None'}

Respond with a short, enthusiastic message (1-2 sentences) that confirms the action.
If it failed, provide helpful guidance.`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Error generating response:', error)
      return success
        ? `Successfully executed ${intent.action} command!`
        : `Failed to execute ${intent.action} command.`
    }
  }

  async generateClarityContract(description: string, tokenName?: string): Promise<string> {
    const prompt = `You are an expert Clarity smart contract developer. Generate a secure, production-ready Clarity smart contract based on this description:

${description}
${tokenName ? `Token Name: ${tokenName}` : ''}

Requirements:
- Follow SIP-010 standard for fungible tokens if applicable
- Include proper error handling with (err ...) patterns
- Implement authorization checks
- Use define-read-only for view functions
- Use define-public for state-changing functions
- Include comprehensive trait implementations
- Add proper data validation
- Use principal types correctly
- Implement events via print statements

Return ONLY the Clarity code without explanations, markdown formatting, or code blocks. Start directly with (define-constant or (define-fungible-token.`

    const result = await this.proModel.generateContent(prompt)
    const response = await result.response
    let code = response.text().trim()

    code = code.replace(/^```clarity\s*/gm, '').replace(/^```\s*/gm, '').replace(/```$/gm, '')

    return code
  }

  async analyzeContract(contractCode: string): Promise<{
    securityIssues: string[]
    gasOptimizations: string[]
    bestPractices: string[]
    riskScore: number
  }> {
    const prompt = `You are a Clarity smart contract security auditor. Analyze this contract for:
1. Security vulnerabilities (reentrancy, integer overflow, authorization bypass)
2. Gas optimization opportunities
3. Best practice violations
4. Potential edge cases

Contract:
${contractCode}

Respond in JSON format:
{
  "securityIssues": ["issue1", "issue2"],
  "gasOptimizations": ["opt1", "opt2"],
  "bestPractices": ["practice1", "practice2"],
  "riskScore": 0-100
}`

    const result = await this.proModel.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      securityIssues: [],
      gasOptimizations: [],
      bestPractices: [],
      riskScore: 0
    }
  }

  async analyzeTransactionHistory(transactions: any[]): Promise<{
    insights: string[]
    patterns: string[]
    recommendations: string[]
    riskAssessment: string
  }> {
    const prompt = `Analyze these blockchain transactions and provide insights:

${JSON.stringify(transactions, null, 2)}

Identify:
1. Trading patterns and behaviors
2. Risk indicators
3. Optimization opportunities
4. Strategic recommendations

Respond in JSON format with insights, patterns, recommendations, and riskAssessment fields.`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      insights: ["No patterns detected yet"],
      patterns: [],
      recommendations: ["Continue monitoring transactions"],
      riskAssessment: "Low activity"
    }
  }

  async generatePortfolioInsights(balance: number, holdings: any[]): Promise<{
    summary: string
    allocation: string[]
    recommendations: string[]
    riskLevel: string
  }> {
    const prompt = `Analyze this crypto portfolio:

Balance: ${balance} STX
Holdings: ${JSON.stringify(holdings)}

Provide:
1. Portfolio summary
2. Asset allocation analysis
3. Strategic recommendations
4. Risk level assessment

Respond in JSON format.`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      summary: "Analyzing portfolio...",
      allocation: [],
      recommendations: [],
      riskLevel: "Unknown"
    }
  }

  async explainTransaction(txData: any): Promise<string> {
    const prompt = `Explain this blockchain transaction in simple terms:

${JSON.stringify(txData, null, 2)}

Provide a clear, non-technical explanation of what happened, why it matters, and any important details.`

    const result = await this.model.generateContent(prompt)
    const response = await result.response
    return response.text()
  }
}

export function createGeminiAgent(): GeminiAgent {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }
  return new GeminiAgent(apiKey)
}

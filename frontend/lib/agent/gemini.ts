import { GoogleGenerativeAI } from '@google/generative-ai'

export interface CommandIntent {
  action: 'launch' | 'buy' | 'sell' | 'swap' | 'deploy' | 'send' | 'unknown'
  params: {
    token?: string
    amount?: number
    fromToken?: string
    toToken?: string
    dex?: 'alex' | 'velar'
    contractType?: string
    recipient?: string
    memo?: string
  }
  confidence: number
}

export class GeminiAgent {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async parseCommand(userInput: string): Promise<CommandIntent> {
    // Simple pattern matching for command parsing
    const input = userInput.toLowerCase()

    // Swap tokens
    if (input.includes('swap') || input.includes('trade')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)/)
      const fromMatch = userInput.match(/(\d+(?:\.\d+)?)\s+(\w+)\s+for/i)
      const toMatch = userInput.match(/for\s+(\w+)/i)

      return {
        action: 'swap',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : 10,
          fromToken: fromMatch ? fromMatch[2].toUpperCase() : 'STX',
          toToken: toMatch ? toMatch[1].toUpperCase() : 'ALEX',
          dex: 'alex'
        },
        confidence: 0.9
      }
    }

    // Send STX
    if (input.includes('send')) {
      const amountMatch = userInput.match(/(\d+(?:\.\d+)?)\s*stx/i) || userInput.match(/(\d+(?:\.\d+)?)/)
      const addressMatch = userInput.match(/to\s+(ST[A-Z0-9]+)/i) || userInput.match(/(ST[A-Z0-9]{38,})/i)

      return {
        action: 'send',
        params: {
          amount: amountMatch ? parseFloat(amountMatch[1]) : 1,
          recipient: addressMatch ? addressMatch[1] : '',
          memo: 'Sent by AI agent'
        },
        confidence: addressMatch ? 0.9 : 0.5
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
}

export function createGeminiAgent(): GeminiAgent {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }
  return new GeminiAgent(apiKey)
}

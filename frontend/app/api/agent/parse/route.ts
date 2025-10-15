import { NextRequest, NextResponse } from 'next/server'
import { createGeminiAgent } from '@/lib/agent/gemini'

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini agent
    const agent = createGeminiAgent()

    // Parse command with Gemini
    const intent = await agent.parseCommand(command)

    console.log('Gemini parsed command:', intent)

    if (intent.confidence < 0.6) {
      return NextResponse.json({
        success: false,
        message: "I'm not sure what you want me to do. Can you rephrase?",
        intent,
      })
    }

    // Return parsed intent for frontend to execute
    return NextResponse.json({
      success: true,
      action: intent.action,
      confidence: intent.confidence,
      params: intent.params,
    })
  } catch (error: any) {
    console.error('Agent parse error:', error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message || 'Failed to parse command'}`,
      },
      { status: 500 }
    )
  }
}

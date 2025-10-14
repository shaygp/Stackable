import { NextRequest, NextResponse } from 'next/server'
import { createGeminiAgent } from '@/lib/agent/gemini'
import { createAgentWallet } from '@/lib/agent/wallet'
import { stringAsciiCV, uintCV, contractPrincipalCV, PostConditionMode } from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    // Initialize AI agent and wallet
    const gemini = createGeminiAgent()
    const wallet = await createAgentWallet()

    // Parse command with agent
    const intent = await gemini.parseCommand(command)

    console.log('Command intent:', intent)

    if (intent.confidence < 0.7) {
      return NextResponse.json({
        success: false,
        message: "I'm not sure what you want me to do. Can you rephrase?",
        intent,
      })
    }

    const network = new StacksTestnet()
    let result: any

    // Execute action based on intent
    switch (intent.action) {
      case 'swap':
        if (!intent.params.fromToken || !intent.params.toToken || !intent.params.amount) {
          return NextResponse.json({
            success: false,
            message: 'Please specify tokens and amount to swap',
          })
        }

        // Only ALEX is supported currently
        if (intent.params.dex !== 'alex') {
          return NextResponse.json({
            success: false,
            message: 'Currently only ALEX DEX is supported. Use "swap on alex"',
          })
        }

        const alexConfig = {
          swapContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.swap-helper-v1-03',
          tokenXContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.token-wstx',
          tokenYContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.age000-governance-token',
        }

        const [contractAddress, contractName] = alexConfig.swapContract.split('.')
        const [tokenXAddress, tokenXName] = alexConfig.tokenXContract.split('.')
        const [tokenYAddress, tokenYName] = alexConfig.tokenYContract.split('.')

        result = await wallet.signAndBroadcastTransaction({
          contractAddress,
          contractName,
          functionName: 'swap-helper',
          functionArgs: [
            contractPrincipalCV(tokenXAddress, tokenXName),
            contractPrincipalCV(tokenYAddress, tokenYName),
            uintCV(100000000),
            uintCV(100000000),
            uintCV(Math.floor(intent.params.amount * 1000000)),
            uintCV(Math.floor(intent.params.amount * 0.995 * 1000000)),
          ],
          postConditionMode: PostConditionMode.Allow,
        })
        break

      case 'send':
        if (!intent.params.recipient || !intent.params.amount) {
          return NextResponse.json({
            success: false,
            message: 'Please specify recipient address and amount to send. Example: "send 1 STX to ST1234..."',
          })
        }

        result = await wallet.sendSTX(
          intent.params.recipient,
          intent.params.amount,
          intent.params.memo || 'Sent by AI agent'
        )
        break

      case 'deploy':
        return NextResponse.json({
          success: false,
          message: 'Contract deployment coming soon! For now, visit /templates to deploy contracts manually.',
        })

      default:
        return NextResponse.json({
          success: false,
          message: "I don't understand that command. Try: swap, send, or deploy",
          intent,
        })
    }

    // Generate friendly response
    const responseMessage = await gemini.generateResponse(intent, true, result.txid)
    const txId = result.txid || result
    const explorerLink = `https://explorer.hiro.so/txid/${txId}?chain=testnet`

    return NextResponse.json({
      success: true,
      message: responseMessage,
      txId,
      explorerLink,
      intent,
      agentAddress: wallet.getAddress(),
    })
  } catch (error: any) {
    console.error('Agent execution error:', error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message || 'Failed to execute command'}`,
      },
      { status: 500 }
    )
  }
}

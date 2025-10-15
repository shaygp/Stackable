"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Send, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { openContractCall } from '@stacks/connect'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { PostConditionMode } from '@stacks/transactions'
import { toClarityValueArray } from '@/lib/agent/clarity-helpers'
import type { ParsedCommand, NetworkType } from '@/lib/agent/types'

interface AgentCommandInterfaceProps {
  network?: NetworkType
  onTransactionSubmit?: (txId: string) => void
}

export default function AgentCommandInterface({
  network = 'testnet',
  onTransactionSubmit,
}: AgentCommandInterfaceProps) {
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string>('')
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null)
  const [error, setError] = useState<string>('')

  const exampleCommands = [
    'show my balance',
    'launch a token called MOON',
    'buy 100 DOGE tokens',
    'swap 5 STX for ALEX',
    'register alice.btc',
    'stake 1000 STX in pool',
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return

    setLoading(true)
    setError('')
    setResponse('')
    setParsedCommand(null)

    try {
      // Parse command with Claude agent
      const res = await fetch('/api/agent/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, network }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Failed to parse command')
        setLoading(false)
        return
      }

      setParsedCommand(data)
      setResponse(data.message)

      // Handle balance query (read-only)
      if (data.action === 'balance') {
        // TODO: Fetch balance from Stacks API
        setResponse('Balance query prepared. Connect your wallet to view balance.')
        setLoading(false)
        return
      }

      // Execute transaction with user's wallet
      if (data.transactionParams) {
        const { transactionParams } = data

        // Show confirmation to user
        const confirmed = window.confirm(
          `${transactionParams.description}\n\nEstimated cost: ${transactionParams.estimatedCost}\n\nContinue?`
        )

        if (!confirmed) {
          setResponse('Transaction cancelled by user')
          setLoading(false)
          return
        }

        // Convert function args to Stacks Clarity values
        const functionArgs = toClarityValueArray(transactionParams.functionArgs)

        // Open wallet for signing
        await openContractCall({
          network: network === 'testnet' ? new StacksTestnet() : new StacksMainnet(),
          contractAddress: transactionParams.contractAddress,
          contractName: transactionParams.contractName,
          functionName: transactionParams.functionName,
          functionArgs,
          postConditionMode: PostConditionMode.Allow,
          onFinish: (result) => {
            setResponse(`Transaction broadcast! TX ID: ${result.txId}`)
            setLoading(false)
            onTransactionSubmit?.(result.txId)
          },
          onCancel: () => {
            setResponse('Transaction cancelled')
            setLoading(false)
          },
        })
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute command')
      setLoading(false)
    }
  }

  function setExampleCommand(cmd: string) {
    setCommand(cmd)
    setError('')
    setResponse('')
    setParsedCommand(null)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Claude Agent for Stacks
        </CardTitle>
        <CardDescription>
          Type natural language commands to interact with the Stacks blockchain
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Example Commands */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((cmd, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setExampleCommand(cmd)}
              >
                {cmd}
              </Badge>
            ))}
          </div>
        </div>

        {/* Command Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g., buy 100 DOGE tokens"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !command.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>

        {/* Network Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={network === 'testnet' ? 'secondary' : 'default'}>
            {network === 'testnet' ? '🧪 Testnet' : '🌐 Mainnet'}
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Response */}
        {response && !error && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{response}</AlertDescription>
          </Alert>
        )}

        {/* Parsed Command Details */}
        {parsedCommand && parsedCommand.transactionParams && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Action:</span>
                  <span className="ml-2 font-medium">{parsedCommand.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="ml-2 font-medium">
                    {(parsedCommand.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {parsedCommand.transactionParams && (
                <>
                  <div>
                    <span className="text-muted-foreground">Contract:</span>
                    <code className="ml-2 text-xs bg-background px-2 py-1 rounded">
                      {parsedCommand.transactionParams.contractAddress}.
                      {parsedCommand.transactionParams.contractName}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Function:</span>
                    <code className="ml-2 text-xs bg-background px-2 py-1 rounded">
                      {parsedCommand.transactionParams.functionName}
                    </code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <span className="ml-2">{parsedCommand.transactionParams.description}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="ml-2">{parsedCommand.transactionParams.estimatedCost}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Supported commands:</strong> balance, launch token, buy/sell tokens, swap on
            DEX, register BNS, stake STX
          </p>
          <p>
            <strong>Note:</strong> All transactions require wallet approval. This agent only parses
            commands and never executes transactions automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

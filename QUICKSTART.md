# Quick Start: Claude Agent for Stacks

Get the Claude-powered blockchain agent running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- A Stacks wallet (Hiro, Xverse, or Leather)

## Step 1: Install Dependencies

```bash
cd frontend
npm install @anthropic-ai/sdk --legacy-peer-deps
```

## Step 2: Configure Environment

Create `frontend/.env.local`:

```bash
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Required: Your deployer address (testnet)
NEXT_PUBLIC_DEPLOYER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

## Step 3: Deploy Bonding Curve Contract (Testnet)

```bash
# Install Clarinet if you haven't
brew install clarinet

# Navigate to contracts directory
cd ../contracts

# Deploy to testnet
clarinet deploy --testnet bonding-curve

# Note: Save your deployer address and update NEXT_PUBLIC_DEPLOYER_ADDRESS
```

## Step 4: Initialize the Contract

After deployment, initialize the bonding curve contract using Clarinet or the Stacks Explorer:

```clarity
(contract-call? .bonding-curve initialize tx-sender)
```

## Step 5: Start the Development Server

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000

## Step 6: Test the Agent

### Option A: Use the UI Component

Add to any page:

```tsx
import AgentCommandInterface from '@/components/AgentCommandInterface'

export default function TestPage() {
  return (
    <div className="container mx-auto p-8">
      <AgentCommandInterface network="testnet" />
    </div>
  )
}
```

### Option B: Test the API Directly

```bash
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "buy 100 DOGE tokens", "network": "testnet"}'
```

Expected response:
```json
{
  "success": true,
  "action": "buy-token",
  "confidence": 0.95,
  "message": "Buy 100 DOGE tokens from bonding curve",
  "transactionParams": {
    "contractAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "contractName": "bonding-curve",
    "functionName": "buy-token",
    ...
  }
}
```

## Try These Commands

1. **Check balance**: "show my balance"
2. **Launch token**: "launch a token called MOON"
3. **Buy token**: "buy 100 DOGE tokens"
4. **Sell token**: "sell 50 DOGE tokens"
5. **Swap on DEX**: "swap 5 STX for ALEX"
6. **Register BNS**: "register alice.btc"
7. **Stake STX**: "stake 1000 STX in pool"
8. **Send STX**: "send 10 STX to ST1234..."

## Complete Integration Example

```tsx
'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { StacksTestnet } from '@stacks/network'
import { PostConditionMode } from '@stacks/transactions'
import { toClarityValueArray } from '@/lib/agent/clarity-helpers'

export default function AgentDemo() {
  const [command, setCommand] = useState('')
  const [result, setResult] = useState('')

  async function handleCommand() {
    // 1. Parse command with Claude
    const res = await fetch('/api/agent/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, network: 'testnet' })
    })

    const data = await res.json()

    if (!data.success) {
      setResult(data.message)
      return
    }

    // 2. Handle balance query (read-only)
    if (data.action === 'balance') {
      setResult('Balance query - connect wallet to view')
      return
    }

    // 3. Execute transaction with user's wallet
    if (data.transactionParams) {
      const { transactionParams } = data

      await openContractCall({
        network: new StacksTestnet(),
        contractAddress: transactionParams.contractAddress,
        contractName: transactionParams.contractName,
        functionName: transactionParams.functionName,
        functionArgs: toClarityValueArray(transactionParams.functionArgs),
        postConditionMode: PostConditionMode.Allow,
        onFinish: (tx) => {
          setResult(`Success! TX: ${tx.txId}`)
        },
        onCancel: () => {
          setResult('Cancelled')
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Try: buy 100 DOGE tokens"
        className="border p-2 rounded w-full"
      />
      <button onClick={handleCommand} className="bg-blue-500 text-white px-4 py-2 rounded">
        Execute
      </button>
      {result && <div className="p-4 bg-gray-100 rounded">{result}</div>}
    </div>
  )
}
```

## Troubleshooting

### API Key Error
```
Error: ANTHROPIC_API_KEY not configured
```
**Solution**: Add your API key to `.env.local` and restart the dev server

### Contract Not Found
```
Error: Contract not found
```
**Solution**:
1. Deploy bonding-curve contract to testnet
2. Update `NEXT_PUBLIC_DEPLOYER_ADDRESS` with your address
3. Restart dev server

### Low Confidence
```
success: false, message: "I'm not sure what you want..."
```
**Solution**: Make your command more specific:
- ❌ "buy doge"
- ✅ "buy 100 DOGE tokens"

### Wallet Not Connected
**Solution**: Install and connect a Stacks wallet (Hiro, Xverse, or Leather)

## Next Steps

1. **Read the full docs**: See `/frontend/lib/agent/README.md`
2. **Deploy to testnet**: Test all actions with testnet STX
3. **Customize prompts**: Edit `/frontend/lib/agent/claude.ts` to add new commands
4. **Add UI**: Integrate `AgentCommandInterface` component into your app
5. **Go to mainnet**: Change `network: 'mainnet'` and update contract addresses

## Getting Testnet STX

1. Visit [Stacks Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet)
2. Enter your testnet address
3. Request STX (up to 500 STX per request)

## Example Flow

1. User types: **"launch a token called MOON"**
2. Agent parses → Returns `launch-token` transaction params
3. Frontend calls `openContractCall()` with params
4. User's wallet prompts for confirmation
5. User signs → Transaction broadcast to Stacks
6. Frontend shows TX ID and explorer link

## Support

- **Documentation**: `/frontend/lib/agent/README.md`
- **Implementation Plan**: `/IMPLEMENTATION_PLAN.md`
- **API Reference**: See README for full API details

## Security Notes

⚠️ **Important:**
- Never store private keys in code
- Always require user wallet confirmation
- Show full transaction details before signing
- Use post-conditions to protect users
- Rate limit API calls in production

## What's Next?

The agent is now ready to use! Try integrating it into your Stacks application:

```tsx
// In any page
import AgentCommandInterface from '@/components/AgentCommandInterface'

<AgentCommandInterface
  network="testnet"
  onTransactionSubmit={(txId) => {
    console.log('Transaction:', txId)
    router.push(`/tx/${txId}`)
  }}
/>
```

Happy building! 🚀

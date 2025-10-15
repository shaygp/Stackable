# Claude Agent for Stacks Blockchain

This agent uses Claude AI to parse natural language commands into structured Stacks blockchain transaction parameters that can be executed via a user's connected wallet.

## Overview

The agent **does not execute transactions**. It only parses commands and returns structured parameters that your frontend can use with `@stacks/connect` to prompt the user's wallet.

## Setup

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_DEPLOYER_ADDRESS=your_deployer_address_for_bonding_curve
```

### 3. Deploy Contracts

Deploy the bonding curve contract from `/contracts/bonding-curve.clar` to testnet and update `NEXT_PUBLIC_DEPLOYER_ADDRESS`.

## Usage

### API Endpoint

POST to `/api/agent/parse`:

```typescript
const response = await fetch('/api/agent/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'buy 100 DOGE tokens',
    network: 'testnet' // or 'mainnet'
  })
})

const data = await response.json()
```

### Response Format

```typescript
{
  success: true,
  action: 'buy-token',
  confidence: 0.95,
  message: 'Buy 100 DOGE tokens from bonding curve',
  transactionParams: {
    contractAddress: 'ST1234...',
    contractName: 'bonding-curve',
    functionName: 'buy-token',
    functionArgs: [
      { type: 'string-ascii', value: 'DOGE' },
      { type: 'uint', value: 100000000 },
      { type: 'uint', value: 500 }
    ],
    network: 'testnet',
    description: 'Buy 100 DOGE tokens from bonding curve',
    estimatedCost: 'Variable based on bonding curve price'
  }
}
```

### Execute with Stacks Connect

```typescript
import { openContractCall } from '@stacks/connect'
import { toClarityValueArray } from '@/lib/agent/clarity-helpers'

// Get parsed command from API
const { transactionParams } = await parseCommand('buy 100 DOGE')

// Convert function args to Stacks Clarity values
const functionArgs = toClarityValueArray(transactionParams.functionArgs)

// Prompt user's wallet
await openContractCall({
  network: transactionParams.network === 'testnet'
    ? new StacksTestnet()
    : new StacksMainnet(),
  contractAddress: transactionParams.contractAddress,
  contractName: transactionParams.contractName,
  functionName: transactionParams.functionName,
  functionArgs,
  postConditionMode: PostConditionMode.Allow,
  onFinish: (data) => {
    console.log('Transaction broadcast:', data.txId)
  },
  onCancel: () => {
    console.log('User cancelled')
  }
})
```

## Supported Commands

### 1. Check Balance

```
"show my balance"
"what's my balance"
"check my STX"
```

Returns: `balanceQuery` - fetch from Stacks API

### 2. Launch Token

```
"launch a token called MOON"
"create token ROCKET with 1M supply"
"deploy DOGE token"
```

Parameters:
- `symbol`: Token symbol (max 32 chars)
- `basePrice`: Initial price (default: 1 STX)
- `curveType`: 0=linear, 1=exponential, 2=logarithmic, 3=sigmoid
- `slope`: Price curve slope (default: 1000)
- `graduationThreshold`: STX needed to graduate (default: 100k STX)
- `maxSupply`: Maximum token supply (default: 1B tokens)

### 3. Buy Token

```
"buy 100 DOGE tokens"
"get 500 MOON"
"purchase 1000 ROCKET for up to 10 STX"
```

Parameters:
- `symbol`: Token symbol
- `amount`: Number of tokens (in micro-units)
- `maxSlippage`: Max slippage (basis points, default: 500 = 5%)

### 4. Sell Token

```
"sell 50 DOGE tokens"
"dump 1000 MOON"
"sell ROCKET for at least 5 STX"
```

Parameters:
- `symbol`: Token symbol
- `amount`: Number of tokens to sell
- `minReceived`: Minimum STX to receive

### 5. Swap on DEX

```
"swap 5 STX for ALEX"
"trade 100 ALEX for STX on alex"
"exchange 10 STX to ALEX"
```

Parameters:
- `dex`: "alex" or "velar"
- `fromToken`: Token to sell
- `toToken`: Token to buy
- `amountIn`: Amount in micro-units
- `minAmountOut`: Minimum amount out

### 6. Register BNS Domain

```
"register alice.btc"
"claim bob.btc domain"
"get myname.btc"
```

Parameters:
- `name`: Name without .btc
- `namespace`: Usually "btc"

Note: BNS registration is a 2-step process (preorder + register)

### 7. Pool Stacking

```
"stake 1000 STX in pool"
"delegate 5000 STX to pool"
"pool stack 2000 STX"
```

Parameters:
- `amount`: STX amount (in microSTX)
- `poolAddress`: Pool operator (optional)

### 8. Direct Stacking

```
"stack 100000 STX to bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
"stake 150000 STX for 3 cycles"
```

Parameters:
- `amount`: Minimum 100,000 STX
- `btcAddress`: Bitcoin address for rewards
- `duration`: Number of cycles (default: 1)

### 9. Send STX

```
"send 10 STX to ST1234..."
"transfer 5 STX to alice"
"pay ST5678... 100 STX"
```

Parameters:
- `recipient`: Stacks address
- `amount`: STX amount (in microSTX)
- `memo`: Optional memo

## Units

All amounts are in **micro-units**:
- 1 STX = 1,000,000 microSTX
- 1 token = 1,000,000 micro-tokens

The agent handles this conversion automatically.

## Contract Addresses

### Testnet

- **Bonding Curve**: `${NEXT_PUBLIC_DEPLOYER_ADDRESS}.bonding-curve`
- **BNS**: `ST000000000000000000002AMW42H.bns`
- **PoX-4**: `ST000000000000000000002AMW42H.pox-4`
- **ALEX Swap**: `ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.swap-helper-v1-03`
- **ALEX wSTX**: `ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.token-wstx`
- **ALEX Token**: `ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.age000-governance-token`

## Error Handling

The agent returns confidence scores. Commands with confidence < 0.6 are rejected:

```typescript
if (parsed.confidence < 0.6) {
  // Ask user to rephrase
  console.log("I didn't understand that. Try: 'buy 100 DOGE tokens'")
}
```

## Example Integration

```typescript
// components/AgentChat.tsx
import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { toClarityValueArray } from '@/lib/agent/clarity-helpers'
import { StacksTestnet } from '@stacks/network'

export function AgentChat() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')

  async function handleSubmit() {
    // Parse command
    const res = await fetch('/api/agent/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: input, network: 'testnet' })
    })

    const data = await res.json()

    if (!data.success) {
      setResponse(data.message)
      return
    }

    setResponse(data.message)

    // Handle balance query
    if (data.action === 'balance') {
      // Fetch from Stacks API
      return
    }

    // Execute transaction
    if (data.transactionParams) {
      const { transactionParams } = data

      await openContractCall({
        network: new StacksTestnet(),
        contractAddress: transactionParams.contractAddress,
        contractName: transactionParams.contractName,
        functionName: transactionParams.functionName,
        functionArgs: toClarityValueArray(transactionParams.functionArgs),
        onFinish: (result) => {
          setResponse(`Transaction sent: ${result.txId}`)
        },
        onCancel: () => {
          setResponse('Transaction cancelled')
        }
      })
    }
  }

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Try: buy 100 DOGE tokens"
      />
      <button onClick={handleSubmit}>Send</button>
      <div>{response}</div>
    </div>
  )
}
```

## Advanced: Custom Prompts

You can customize the Claude system prompt in `/lib/agent/claude.ts` to:
- Add new contract integrations
- Support new token standards
- Add domain-specific commands
- Customize response formats

## Security Notes

1. **Always validate** transaction parameters before execution
2. **Show users** what they're signing (amount, contract, function)
3. **Use post-conditions** to protect users from unexpected outcomes
4. **Never auto-execute** transactions without user confirmation
5. **Rate limit** API calls to prevent abuse

## Testing

Test with various commands:

```bash
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "buy 100 DOGE tokens", "network": "testnet"}'
```

## License

MIT

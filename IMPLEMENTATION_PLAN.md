# Claude Agent Implementation Plan for Stacks Blockchain

## Overview

This implementation provides a Claude AI-powered agent that translates natural language commands into structured Stacks blockchain transaction parameters. The agent **does NOT execute transactions** - it only parses commands and returns parameters for the frontend to execute via the user's wallet using `@stacks/connect`.

## Architecture

```
User Input (Natural Language)
    ↓
Claude Agent API (/api/agent/parse)
    ↓
Structured Transaction Parameters
    ↓
Frontend executes via @stacks/connect
    ↓
User's Wallet (Hiro, Xverse, etc.)
```

## Files Created

### Core Agent Files

1. **`/frontend/lib/agent/types.ts`**
   - TypeScript types for all transaction parameters
   - Action types, network types, Clarity value types
   - Parameter interfaces for each action

2. **`/frontend/lib/agent/claude.ts`**
   - Main Claude agent implementation
   - Command parsing logic
   - Transaction parameter builders for each action type
   - Contract address constants

3. **`/frontend/lib/agent/clarity-helpers.ts`**
   - Utility functions to convert simplified Clarity values to @stacks/transactions format
   - Helper for parsing contract identifiers

4. **`/frontend/app/api/agent/parse/route.ts`** (Updated)
   - API endpoint that receives commands and returns parsed parameters
   - Input validation
   - Error handling

### UI Components

5. **`/frontend/components/AgentCommandInterface.tsx`**
   - Complete React component for agent interaction
   - Command input with examples
   - Transaction confirmation flow
   - Response display

### Documentation

6. **`/frontend/lib/agent/README.md`**
   - Comprehensive usage guide
   - API documentation
   - Example commands
   - Integration examples

## Supported Actions

### 1. Balance (Read-only)
**Commands:** "show my balance", "check my STX"

Returns `balanceQuery` object - frontend should fetch from Stacks API

### 2. Launch Token
**Commands:** "launch a token called MOON", "create DOGE token"

**Parameters:**
- `symbol`: Token symbol
- `basePrice`: Initial price (default: 1 STX)
- `curveType`: 0=linear, 1=exponential, 2=logarithmic, 3=sigmoid
- `slope`: Price curve slope
- `graduationThreshold`: STX needed to graduate to DEX
- `maxSupply`: Maximum token supply

**Contract:** `${DEPLOYER_ADDRESS}.bonding-curve`
**Function:** `launch-token`

### 3. Buy Token
**Commands:** "buy 100 DOGE tokens", "get 500 MOON"

**Parameters:**
- `symbol`: Token symbol
- `amount`: Number of tokens (in micro-units)
- `maxSlippage`: Max acceptable slippage (basis points)

**Contract:** `${DEPLOYER_ADDRESS}.bonding-curve`
**Function:** `buy-token`

### 4. Sell Token
**Commands:** "sell 50 DOGE tokens", "dump 1000 MOON"

**Parameters:**
- `symbol`: Token symbol
- `amount`: Number of tokens to sell
- `minReceived`: Minimum STX to receive

**Contract:** `${DEPLOYER_ADDRESS}.bonding-curve`
**Function:** `sell-token`

### 5. Swap on DEX
**Commands:** "swap 5 STX for ALEX", "trade 100 ALEX for STX"

**Parameters:**
- `dex`: "alex" or "velar"
- `fromToken`: Source token
- `toToken`: Destination token
- `amountIn`: Amount to swap (micro-units)
- `minAmountOut`: Minimum to receive

**Contract:** `ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.swap-helper-v1-03` (testnet)
**Function:** `swap-helper`

### 6. Register BNS
**Commands:** "register alice.btc", "claim bob.btc"

**Parameters:**
- `name`: Name without .btc
- `namespace`: Usually "btc"

**Contract:** `ST000000000000000000002AMW42H.bns`
**Function:** `name-preorder` (step 1 of 2)

### 7. Pool Stacking
**Commands:** "stake 1000 STX in pool", "delegate 5000 STX"

**Parameters:**
- `amount`: STX amount (micro-units)
- `poolAddress`: Pool operator (optional)

**Contract:** `ST000000000000000000002AMW42H.pox-4`
**Function:** `delegate-stx`

### 8. Direct Stacking
**Commands:** "stack 100000 STX to bc1qxy2k...", "stake 150k STX for 3 cycles"

**Parameters:**
- `amount`: Minimum 100,000 STX
- `btcAddress`: Bitcoin address for rewards
- `duration`: Number of cycles

**Contract:** `ST000000000000000000002AMW42H.pox-4`
**Function:** `stack-stx`

### 9. Send STX
**Commands:** "send 10 STX to ST1234...", "transfer 5 STX"

**Parameters:**
- `recipient`: Stacks address
- `amount`: STX amount (micro-units)
- `memo`: Optional memo

**Special:** Uses STX transfer, not contract call

## Setup Instructions

### 1. Environment Variables

Create `/frontend/.env.local`:

```bash
# Required: Anthropic API Key for Claude
ANTHROPIC_API_KEY=sk-ant-api03-...

# Required: Your deployer address for bonding curve contract
NEXT_PUBLIC_DEPLOYER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM

# Optional: Gemini API key (if keeping existing agent)
GEMINI_API_KEY=...
```

### 2. Install Dependencies

```bash
cd frontend
npm install @anthropic-ai/sdk --legacy-peer-deps
```

### 3. Deploy Bonding Curve Contract

Deploy `/contracts/bonding-curve.clar` to testnet:

```bash
# Using clarinet or stacks CLI
clarinet deploy --testnet bonding-curve

# Update NEXT_PUBLIC_DEPLOYER_ADDRESS with your address
```

### 4. Initialize Bonding Curve Contract

After deployment, call the `initialize` function:

```clarity
(contract-call? .bonding-curve initialize tx-sender)
```

## Usage Examples

### Basic Usage

```typescript
// Parse a command
const response = await fetch('/api/agent/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'buy 100 DOGE tokens',
    network: 'testnet'
  })
})

const data = await response.json()
// {
//   success: true,
//   action: 'buy-token',
//   confidence: 0.95,
//   message: 'Buy 100 DOGE tokens from bonding curve',
//   transactionParams: { ... }
// }
```

### Execute Transaction

```typescript
import { openContractCall } from '@stacks/connect'
import { toClarityValueArray } from '@/lib/agent/clarity-helpers'
import { StacksTestnet } from '@stacks/network'
import { PostConditionMode } from '@stacks/transactions'

// Get transaction params from agent
const { transactionParams } = data

// Convert function args
const functionArgs = toClarityValueArray(transactionParams.functionArgs)

// Execute with user's wallet
await openContractCall({
  network: new StacksTestnet(),
  contractAddress: transactionParams.contractAddress,
  contractName: transactionParams.contractName,
  functionName: transactionParams.functionName,
  functionArgs,
  postConditionMode: PostConditionMode.Allow,
  onFinish: (result) => {
    console.log('TX ID:', result.txId)
  },
  onCancel: () => {
    console.log('Cancelled')
  }
})
```

### Using the Component

```tsx
import AgentCommandInterface from '@/components/AgentCommandInterface'

export default function MyPage() {
  return (
    <AgentCommandInterface
      network="testnet"
      onTransactionSubmit={(txId) => {
        console.log('Transaction submitted:', txId)
        // Navigate to explorer, show confirmation, etc.
      }}
    />
  )
}
```

## API Reference

### POST /api/agent/parse

**Request:**
```json
{
  "command": "buy 100 DOGE tokens",
  "network": "testnet"
}
```

**Response (Success):**
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
    "functionArgs": [
      { "type": "string-ascii", "value": "DOGE" },
      { "type": "uint", "value": 100000000 },
      { "type": "uint", "value": 500 }
    ],
    "network": "testnet",
    "description": "Buy 100 DOGE tokens from bonding curve",
    "estimatedCost": "Variable based on bonding curve price"
  },
  "rawParams": {
    "symbol": "DOGE",
    "amount": 100000000,
    "maxSlippage": 500
  }
}
```

**Response (Low Confidence):**
```json
{
  "success": false,
  "message": "I'm not sure what you want me to do. Can you rephrase?",
  "parsed": {
    "action": "unknown",
    "confidence": 0.4
  }
}
```

## Security Considerations

1. **Never Auto-Execute**: Always require user confirmation via wallet
2. **Show Full Details**: Display contract, function, and parameters before signing
3. **Use Post-Conditions**: Protect users from unexpected token transfers
4. **Validate Addresses**: Check that addresses are valid Stacks/Bitcoin addresses
5. **Rate Limiting**: Implement rate limits on API endpoint
6. **Input Sanitization**: Validate all user inputs before passing to Claude
7. **Error Handling**: Don't expose sensitive errors to users

## Testing

### Test Commands

```bash
# Balance check
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "show my balance", "network": "testnet"}'

# Launch token
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "launch a token called MOON", "network": "testnet"}'

# Buy token
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "buy 100 DOGE tokens", "network": "testnet"}'

# Swap
curl -X POST http://localhost:3000/api/agent/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "swap 5 STX for ALEX", "network": "testnet"}'
```

### Expected Behavior

1. Commands with clear intent → confidence > 0.9
2. Ambiguous commands → confidence 0.6-0.8
3. Unclear commands → confidence < 0.6 (rejected)

## Future Enhancements

1. **Transaction History**: Parse "show my last 10 transactions"
2. **Multi-Step Operations**: Handle BNS 2-step registration automatically
3. **Price Queries**: "what's the price of DOGE?"
4. **Market Data**: "show top trending tokens"
5. **Smart Defaults**: Learn user preferences for slippage, gas, etc.
6. **Batch Operations**: "buy 100 DOGE and 50 MOON"
7. **Conditional Orders**: "buy DOGE if price drops below X"
8. **Natural Language Post-Conditions**: "only if I receive at least 100 tokens"

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
- Add `ANTHROPIC_API_KEY` to `.env.local`
- Restart Next.js dev server

### "Contract not found"
- Deploy bonding curve contract to testnet
- Update `NEXT_PUBLIC_DEPLOYER_ADDRESS`

### Low confidence scores
- Make commands more specific
- Include amounts and token symbols
- Use natural language: "buy 100 DOGE tokens" not "buy doge"

### Transaction fails
- Check wallet is connected
- Ensure sufficient STX balance
- Verify contract is deployed and initialized

## Support

For issues or questions:
1. Check the README in `/frontend/lib/agent/README.md`
2. Review example commands above
3. Test with curl to isolate frontend vs backend issues
4. Check Claude API logs for parsing errors

## License

MIT

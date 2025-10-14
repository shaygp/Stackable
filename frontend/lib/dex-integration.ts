import { openContractCall } from '@stacks/connect'
import { StacksNetwork, StacksMainnet, StacksTestnet } from '@stacks/network'
import { stringAsciiCV, uintCV, principalCV, PostConditionMode, contractPrincipalCV } from '@stacks/transactions'

export interface DEXConfig {
  name: string
  swapContract: string
  tokenXContract: string
  tokenYContract: string
  swapFunction: string
}

// ALEX DEX Configuration
export const ALEX_CONFIG_MAINNET: DEXConfig = {
  name: 'ALEX',
  swapContract: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.amm-swap-pool-v1-1',
  tokenXContract: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-wstx',
  tokenYContract: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.token-wnyc',
  swapFunction: 'swap-helper'
}

export const ALEX_CONFIG_TESTNET: DEXConfig = {
  name: 'ALEX',
  swapContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.swap-helper-v1-03',
  tokenXContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.token-wstx',
  tokenYContract: 'ST29E61D211DD0HB0S0JSKZ05X0DSAJS5G5QSTXDX.age000-governance-token',
  swapFunction: 'swap-helper'
}

// Velar DEX Configuration
export const VELAR_CONFIG_MAINNET: DEXConfig = {
  name: 'Velar',
  swapContract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.univ2-core',
  tokenXContract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx',
  tokenYContract: 'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token',
  swapFunction: 'swap-exact-tokens-for-tokens'
}

export const VELAR_CONFIG_TESTNET: DEXConfig = {
  name: 'Velar',
  swapContract: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.univ2-core',
  tokenXContract: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wstx',
  tokenYContract: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.velar-token',
  swapFunction: 'swap-exact-tokens-for-tokens'
}

export function getDEXConfig(dex: 'alex' | 'velar', isMainnet: boolean): DEXConfig {
  if (dex === 'alex') {
    return isMainnet ? ALEX_CONFIG_MAINNET : ALEX_CONFIG_TESTNET
  } else {
    return isMainnet ? VELAR_CONFIG_MAINNET : VELAR_CONFIG_TESTNET
  }
}

export interface SwapParams {
  dex: 'alex' | 'velar'
  fromToken: string
  toToken: string
  amountIn: number
  minAmountOut: number
  isMainnet: boolean
}

export async function executeSwap(
  params: SwapParams,
  onFinish: (data: any) => void,
  onCancel: () => void
) {
  const config = getDEXConfig(params.dex, params.isMainnet)
  const network = params.isMainnet ? new StacksMainnet() : new StacksTestnet()

  // Parse contract address
  const [contractAddress, contractName] = config.swapContract.split('.')

  // Convert amount to microunits (6 decimals for STX)
  const amountInMicro = Math.floor(params.amountIn * 1000000)
  const minAmountOutMicro = Math.floor(params.minAmountOut * 1000000)

  if (params.dex === 'alex') {
    // ALEX swap-helper function signature:
    // (swap-helper token-x-trait token-y-trait factor-x factor-y dx min-dy)
    const [tokenXAddress, tokenXName] = config.tokenXContract.split('.')
    const [tokenYAddress, tokenYName] = config.tokenYContract.split('.')

    await openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: config.swapFunction,
      functionArgs: [
        contractPrincipalCV(tokenXAddress, tokenXName),
        contractPrincipalCV(tokenYAddress, tokenYName),
        uintCV(100000000), // factor-x (8 decimals)
        uintCV(100000000), // factor-y (8 decimals)
        uintCV(amountInMicro),
        uintCV(minAmountOutMicro),
      ],
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    })
  } else {
    // Velar swap function signature:
    // (swap-exact-tokens-for-tokens amount-in min-amount-out path deadline)
    const [tokenXAddress, tokenXName] = config.tokenXContract.split('.')
    const [tokenYAddress, tokenYName] = config.tokenYContract.split('.')

    await openContractCall({
      network,
      contractAddress,
      contractName,
      functionName: config.swapFunction,
      functionArgs: [
        uintCV(amountInMicro),
        uintCV(minAmountOutMicro),
        // Path: [tokenX, tokenY]
        contractPrincipalCV(tokenXAddress, tokenXName),
        contractPrincipalCV(tokenYAddress, tokenYName),
        uintCV(Math.floor(Date.now() / 1000) + 3600), // 1 hour deadline
      ],
      postConditionMode: PostConditionMode.Allow,
      onFinish,
      onCancel,
    })
  }
}

// Helper function to estimate swap output
export async function estimateSwapOutput(
  params: SwapParams
): Promise<number> {
  // This would call read-only functions on the DEX contracts
  // For now, return a simple estimate (in production, call actual contract read functions)
  const slippage = 0.005 // 0.5% slippage
  return params.amountIn * (1 - slippage)
}

// Get popular trading pairs for a DEX
export function getTradingPairs(dex: 'alex' | 'velar', isMainnet: boolean) {
  if (dex === 'alex') {
    return [
      { from: 'STX', to: 'ALEX', pair: 'STX/ALEX' },
      { from: 'STX', to: 'USDA', pair: 'STX/USDA' },
      { from: 'ALEX', to: 'USDA', pair: 'ALEX/USDA' },
    ]
  } else {
    return [
      { from: 'STX', to: 'VELAR', pair: 'STX/VELAR' },
      { from: 'STX', to: 'USDC', pair: 'STX/USDC' },
      { from: 'VELAR', to: 'USDC', pair: 'VELAR/USDC' },
    ]
  }
}

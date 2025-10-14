import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id

    // Map contract IDs to file paths
    const contractPaths: Record<string, string> = {
      'bonding-curve': '../../../contracts/bonding-curve.clar',
      'staking-pool': '../../../contracts/staking-pool.clar',
      'liquidity-pool': '../../../contracts/liquidity-pool.clar',
      'treasury': '../../../contracts/treasury.clar',
    }

    const relativePath = contractPaths[contractId]
    if (!relativePath) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    const contractPath = path.join(process.cwd(), relativePath)
    const contractCode = fs.readFileSync(contractPath, 'utf-8')

    return new NextResponse(contractCode, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error reading contract:', error)
    return NextResponse.json(
      { error: 'Failed to read contract' },
      { status: 500 }
    )
  }
}

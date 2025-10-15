import { NextRequest, NextResponse } from 'next/server'
import { createGeminiAgent } from '@/lib/agent/gemini'
import { createAgentWallet } from '@/lib/agent/wallet'
import { stringAsciiCV, stringUtf8CV, uintCV, contractPrincipalCV, PostConditionMode, bufferCV, tupleCV, principalCV, cvToJSON, hexToCV, noneCV } from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { command, userAddress } = await request.json()

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    // Initialize AI agent
    const gemini = createGeminiAgent()

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
    let transactionParams: any = null
    let additionalData: any = {}

    switch (intent.action) {
      case 'stack': {
        if (!intent.params.amount || !intent.params.btcAddress) {
          return NextResponse.json({
            success: false,
            message: 'To stack STX and earn BTC: "stack 100000 STX to bc1..." (min 100,000 STX, provide Bitcoin address for rewards)',
          })
        }

        const POX_CONTRACT = 'ST000000000000000000002AMW42H.pox-4'
        const [poxAddr, poxName] = POX_CONTRACT.split('.')

        result = await wallet.signAndBroadcastTransaction({
          contractAddress: poxAddr,
          contractName: poxName,
          functionName: 'stack-stx',
          functionArgs: [
            uintCV(Math.floor(intent.params.amount * 1000000)),
            tupleCV({
              version: bufferCV(Buffer.from([0x00])),
              hashbytes: bufferCV(Buffer.from(intent.params.btcAddress.slice(3), 'hex'))
            }),
            uintCV(0),
            uintCV(intent.params.duration || 1)
          ],
          postConditionMode: PostConditionMode.Allow,
        })

        additionalData = {
          stackingAmount: intent.params.amount,
          btcRewardAddress: intent.params.btcAddress,
          duration: intent.params.duration || 1,
          cycleInfo: '~2 weeks per cycle, earns BTC rewards'
        }
        break
      }

      case 'send': {
        if (!intent.params.recipient || !intent.params.amount) {
          return NextResponse.json({
            success: false,
            message: 'Specify recipient and amount: "send 1 STX to ST1234..."',
          })
        }

        result = await wallet.sendSTX(
          intent.params.recipient,
          intent.params.amount,
          intent.params.memo || 'AI agent'
        )
        break
      }

      case 'mint-nft': {
        const contractCode = `(define-non-fungible-token ${intent.params.nftName || 'ai-nft'} uint)
(define-data-var token-id-nonce uint u0)

(define-public (mint (recipient principal) (uri (string-utf8 256)))
  (let ((token-id (+ (var-get token-id-nonce) u1)))
    (try! (nft-mint? ${intent.params.nftName || 'ai-nft'} token-id recipient))
    (var-set token-id-nonce token-id)
    (ok token-id)))

(define-read-only (get-last-token-id)
  (ok (var-get token-id-nonce)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some "${intent.params.nftUri || 'ipfs://placeholder'}")))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? ${intent.params.nftName || 'ai-nft'} token-id)))`

        const contractName = `${intent.params.nftName?.toLowerCase() || 'ai-nft'}-${Date.now()}`
        result = await wallet.deployContract(contractName, contractCode)
        additionalData = { contractName, contractCode, nftType: 'SIP-009' }
        break
      }

      case 'bridge-btc': {
        return NextResponse.json({
          success: false,
          message: 'sBTC bridge: Use https://test.bitflow.finance/ faucet to mint testnet sBTC, or visit docs.stacks.co/sbtc for bridge guide',
          bridgeInfo: {
            testnetBridge: 'https://test.bitflow.finance/',
            docs: 'https://docs.stacks.co/guides-and-tutorials/sbtc/how-to-use-the-sbtc-bridge'
          }
        })
      }

      case 'tx-info': {
        if (!intent.params.txid) {
          return NextResponse.json({
            success: false,
            message: 'Provide transaction ID: "tx info 0x..."',
          })
        }

        const txUrl = `${network.coreApiUrl}/extended/v1/tx/${intent.params.txid}`
        const txRes = await fetch(txUrl)
        const txData = await txRes.json()

        if (txData.error) {
          return NextResponse.json({
            success: false,
            message: 'Transaction not found on Stacks testnet',
          })
        }

        const bitcoinAnchorBlock = txData.block_height
        const microblockHash = txData.microblock_hash
        const anchorMode = txData.anchor_mode

        const blockUrl = `${network.coreApiUrl}/extended/v1/block/by_height/${bitcoinAnchorBlock}`
        const blockRes = await fetch(blockUrl)
        const blockData = await blockRes.json()

        return NextResponse.json({
          success: true,
          message: `Transaction found. Anchored to Bitcoin block ${blockData.burn_block_height || 'pending'}`,
          txInfo: {
            stxBlockHeight: bitcoinAnchorBlock,
            btcAnchorBlock: blockData.burn_block_height,
            microblock: microblockHash || 'anchor block',
            status: txData.tx_status,
            fee: `${parseInt(txData.fee_rate || '0') / 1000000} STX`,
            settlementInfo: 'Stacks transactions settle on Bitcoin via OP_RETURN'
          },
          explorerLink: `https://explorer.hiro.so/txid/${intent.params.txid}?chain=testnet`
        })
      }

      case 'bns-register': {
        if (!intent.params.bnsName) {
          return NextResponse.json({
            success: false,
            message: 'Specify name to register: "register myname.btc" (registers on Bitcoin via Stacks)',
          })
        }

        const name = intent.params.bnsName.toLowerCase()
        const namespace = intent.params.namespace || 'btc'
        const salt = createHash('sha256').update(`${name}-${Date.now()}`).digest()

        // Hash160 = RIPEMD160(SHA256(data))
        const fqn = Buffer.concat([Buffer.from(`${name}.${namespace}`, 'utf8'), salt])
        const sha256Hash = createHash('sha256').update(fqn).digest()
        const nameHash = createHash('ripemd160').update(sha256Hash).digest()

        const BNS_CONTRACT = 'ST000000000000000000002AMW42H.bns'
        const [bnsAddr, bnsName] = BNS_CONTRACT.split('.')

        result = await wallet.signAndBroadcastTransaction({
          contractAddress: bnsAddr,
          contractName: bnsName,
          functionName: 'name-preorder',
          functionArgs: [
            bufferCV(nameHash),
            uintCV(640000)
          ],
          postConditionMode: PostConditionMode.Allow,
        })

        additionalData = {
          bnsName: `${name}.${namespace}`,
          step: 'preorder',
          nextStep: 'Wait 1 block, then call name-register',
          bitcoinAnchored: true,
          info: 'BNS names live on Bitcoin blockchain via Stacks'
        }
        break
      }

      case 'create-token': {
        if (!intent.params.tokenSymbol) {
          return NextResponse.json({
            success: false,
            message: 'Specify token: "create token called MOON" (SIP-010 fungible token)',
          })
        }

        const symbol = intent.params.tokenSymbol.toUpperCase()
        const supply = intent.params.tokenSupply || 1000000
        const decimals = 6

        const sip010Code = `(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token ${symbol} u${supply}000000)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (try! (ft-transfer? ${symbol} amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)))

(define-read-only (get-name)
  (ok "${symbol}"))

(define-read-only (get-symbol)
  (ok "${symbol}"))

(define-read-only (get-decimals)
  (ok u${decimals}))

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance ${symbol} who)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply ${symbol})))

(define-read-only (get-token-uri)
  (ok (some u"https://stacks.co")))

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ft-mint? ${symbol} amount recipient)))

(begin
  (try! (ft-mint? ${symbol} u${supply}000000 contract-owner)))`

        const contractName = `${symbol.toLowerCase()}-token-${Date.now()}`
        result = await wallet.deployContract(contractName, sip010Code)
        additionalData = {
          contractName,
          tokenSymbol: symbol,
          totalSupply: `${supply} ${symbol}`,
          decimals,
          standard: 'SIP-010',
          contractCode: sip010Code
        }
        break
      }

      case 'pool-stack': {
        if (!intent.params.amount) {
          return NextResponse.json({
            success: false,
            message: 'Specify amount: "pool stack 1000 STX" (delegate to pool, earn BTC with less STX)',
          })
        }

        // Delegate to PoX-4 contract directly
        // Pool operator would be specified by the user, defaulting to a testnet pool operator
        const TESTNET_POOL_OPERATOR = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG' // Example pool operator address
        const POX_CONTRACT = 'ST000000000000000000002AMW42H.pox-4'
        const [poxAddr, poxName] = POX_CONTRACT.split('.')

        result = await wallet.signAndBroadcastTransaction({
          contractAddress: poxAddr,
          contractName: poxName,
          functionName: 'delegate-stx',
          functionArgs: [
            uintCV(Math.floor(intent.params.amount * 1000000)), // amount-ustx
            principalCV(intent.params.poolAddress || TESTNET_POOL_OPERATOR), // delegate-to
            noneCV(), // until-burn-ht (none = no expiration)
            noneCV() // pox-addr (none = pool operator chooses)
          ],
          postConditionMode: PostConditionMode.Allow,
        })

        additionalData = {
          poolType: 'Delegated Stacking via PoX-4',
          amount: intent.params.amount,
          delegatedTo: intent.params.poolAddress || TESTNET_POOL_OPERATOR,
          benefit: 'Pool operator can now stack these STX and earn BTC rewards',
          info: 'Use delegate-stx function to delegate to pool, pool operator calls delegate-stack-stx'
        }
        break
      }

      case 'balance': {
        if (!userAddress) {
          return NextResponse.json({
            success: false,
            message: 'Please connect your wallet to view balance',
          })
        }

        const [balanceRes, ftRes, nftRes] = await Promise.all([
          fetch(`${network.coreApiUrl}/v2/accounts/${userAddress}`),
          fetch(`${network.coreApiUrl}/extended/v1/address/${userAddress}/balances`),
          fetch(`${network.coreApiUrl}/extended/v1/address/${userAddress}/nft`),
        ])

        const [balanceData, ftData, nftData] = await Promise.all([
          balanceRes.json(),
          ftRes.json(),
          nftRes.json()
        ])

        const stxBalance = parseInt(balanceData.balance || '0') / 1000000
        const stxLocked = parseInt(balanceData.locked || '0') / 1000000

        const fungibleTokens = Object.entries(ftData.fungible_tokens || {}).map(([token, data]: any) => ({
          token: token.split('::')[1] || token,
          balance: data.balance
        }))

        const nfts = nftData.nft_events?.slice(0, 5).map((nft: any) => ({
          asset: nft.asset_identifier.split('::')[1],
          value: nft.value.repr
        })) || []

        return NextResponse.json({
          success: true,
          message: `Portfolio for ${userAddress.substring(0, 8)}...`,
          stxBalance,
          stxLocked,
          fungibleTokens,
          nfts,
          totalAssets: 1 + fungibleTokens.length + nfts.length
        })
      }

      case 'read-contract': {
        if (!intent.params.contractAddress) {
          return NextResponse.json({
            success: false,
            message: 'Specify contract: "read contract ST...CONTRACT function get-balance"',
          })
        }

        const [contractAddr, contractName] = intent.params.contractAddress.split('.')
        const functionName = intent.params.functionName || 'get-balance'

        const readUrl = `${network.coreApiUrl}/v2/contracts/call-read/${contractAddr}/${contractName}/${functionName}`

        const readRes = await fetch(readUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: wallet.getAddress(),
            arguments: []
          })
        })

        const readData = await readRes.json()

        return NextResponse.json({
          success: true,
          message: `Read ${functionName} from ${contractName}`,
          contractAddress: intent.params.contractAddress,
          functionName,
          result: readData.okay ? cvToJSON(hexToCV(readData.result)) : readData,
          readOnly: true
        })
      }

      case 'deploy': {
        const contractCode = await gemini.generateClarityContract(
          intent.params.contractDescription || 'simple contract'
        )

        const contractName = `ai-gen-${Date.now()}`
        result = await wallet.deployContract(contractName, contractCode)
        additionalData = { contractName, contractCode }
        break
      }

      default:
        return NextResponse.json({
          success: false,
          message: "Commands: stack, send, mint NFT, create token, register BNS, pool stack, balance, read contract, tx info",
          intent,
        })
    }

    const responseMessage = await gemini.generateResponse(intent, true, result.txid || 'completed')
    const txId = result.txid || result
    const explorerLink = txId && typeof txId === 'string' && txId.length === 64
      ? `https://explorer.hiro.so/txid/${txId}?chain=testnet`
      : undefined

    return NextResponse.json({
      success: true,
      message: responseMessage,
      txId,
      explorerLink,
      intent,
      agentAddress: wallet.getAddress(),
      ...additionalData
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

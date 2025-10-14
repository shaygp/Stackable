import { generateWallet, generateSecretKey, generateWalletFromSecretKey } from '@stacks/wallet-sdk'
import { makeContractCall, makeContractDeploy, broadcastTransaction, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'

export class AgentWallet {
  private privateKey: string
  private address: string

  private constructor(privateKey: string, address: string) {
    this.privateKey = privateKey
    this.address = address
  }

  static async create(mnemonic: string, isMainnet: boolean = false): Promise<AgentWallet> {
    const wallet = await generateWallet({
      secretKey: mnemonic,
      password: '',
    })

    const account = wallet.accounts[0]

    // Derive address from private key since wallet SDK doesn't provide it directly
    const address = getAddressFromPrivateKey(
      account.stxPrivateKey,
      isMainnet ? TransactionVersion.Mainnet : TransactionVersion.Testnet
    )

    return new AgentWallet(account.stxPrivateKey, address)
  }

  getAddress(): string {
    return this.address
  }

  getPrivateKey(): string {
    return this.privateKey
  }

  async signAndBroadcastTransaction(txOptions: any, isMainnet: boolean = false) {
    const network = isMainnet ? new StacksMainnet() : new StacksTestnet()

    console.log('Agent Address:', this.getAddress())
    console.log('Broadcasting transaction to:', network.coreApiUrl)

    const tx = await makeContractCall({
      ...txOptions,
      network,
      senderKey: this.getPrivateKey(),
    })

    const broadcastResponse = await broadcastTransaction(tx, network)
    console.log('Broadcast response:', broadcastResponse)

    return broadcastResponse
  }

  async deployContract(contractName: string, codeBody: string, isMainnet: boolean = false) {
    const network = isMainnet ? new StacksMainnet() : new StacksTestnet()

    const tx = await makeContractDeploy({
      contractName,
      codeBody,
      network,
      senderKey: this.getPrivateKey(),
      postConditionMode: 1, // Allow
    })

    const broadcastResponse = await broadcastTransaction(tx, network)
    return broadcastResponse
  }

  async sendSTX(recipient: string, amount: number, memo: string = '', isMainnet: boolean = false) {
    const network = isMainnet ? new StacksMainnet() : new StacksTestnet()
    const { makeSTXTokenTransfer } = require('@stacks/transactions')

    const tx = await makeSTXTokenTransfer({
      recipient,
      amount: Math.floor(amount * 1000000), // Convert to microSTX
      memo,
      network,
      senderKey: this.getPrivateKey(),
      anchorMode: 1,
    })

    const broadcastResponse = await broadcastTransaction(tx, network)
    console.log('STX transfer broadcast response:', broadcastResponse)
    return broadcastResponse
  }
}

export async function createAgentWallet(): Promise<AgentWallet> {
  const mnemonic = process.env.AGENT_MNEMONIC
  if (!mnemonic) {
    throw new Error('AGENT_MNEMONIC not configured')
  }
  return await AgentWallet.create(mnemonic)
}

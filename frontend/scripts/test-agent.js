#!/usr/bin/env node

/**
 * Test script for Claude Agent API
 *
 * Usage:
 *   node scripts/test-agent.js
 *   node scripts/test-agent.js "buy 100 DOGE tokens"
 */

const testCommands = [
  'show my balance',
  'launch a token called MOON',
  'buy 100 DOGE tokens',
  'sell 50 DOGE tokens',
  'swap 5 STX for ALEX',
  'register alice.btc',
  'stake 1000 STX in pool',
  'send 10 STX to ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
]

async function testAgent(command, network = 'testnet') {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`Testing: "${command}"`)
  console.log('='.repeat(80))

  try {
    const response = await fetch('http://localhost:3000/api/agent/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, network }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ API Error:', data)
      return false
    }

    if (!data.success) {
      console.log('⚠️  Low confidence or parse error')
      console.log('Message:', data.message)
      if (data.parsed) {
        console.log('Confidence:', data.parsed.confidence)
      }
      return false
    }

    console.log('✅ Success!')
    console.log('\nAction:', data.action)
    console.log('Confidence:', (data.confidence * 100).toFixed(1) + '%')
    console.log('Message:', data.message)

    if (data.transactionParams) {
      console.log('\n📋 Transaction Parameters:')
      console.log('  Contract:', `${data.transactionParams.contractAddress}.${data.transactionParams.contractName}`)
      console.log('  Function:', data.transactionParams.functionName)
      console.log('  Network:', data.transactionParams.network)
      console.log('  Description:', data.transactionParams.description)
      console.log('  Est. Cost:', data.transactionParams.estimatedCost)

      if (data.rawParams) {
        console.log('\n🔧 Raw Parameters:')
        console.log('  ', JSON.stringify(data.rawParams, null, 2).split('\n').join('\n   '))
      }

      console.log('\n📝 Function Arguments:')
      data.transactionParams.functionArgs.forEach((arg, i) => {
        console.log(`  [${i}] ${arg.type}: ${JSON.stringify(arg.value).substring(0, 60)}`)
      })
    }

    if (data.balanceQuery) {
      console.log('\n💰 Balance Query:')
      console.log('  Description:', data.balanceQuery.description)
      console.log('  Action: Fetch from Stacks API')
    }

    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🤖 Claude Agent Test Suite')
  console.log('Testing API endpoint: http://localhost:3000/api/agent/parse')
  console.log('\nMake sure your dev server is running: npm run dev\n')

  const commands = process.argv[2] ? [process.argv[2]] : testCommands

  let passed = 0
  let failed = 0

  for (const command of commands) {
    const success = await testAgent(command)
    if (success) {
      passed++
    } else {
      failed++
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 Test Results')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Total:  ${passed + failed}`)
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  console.log('='.repeat(80))

  process.exit(failed > 0 ? 1 : 0)
}

runTests()

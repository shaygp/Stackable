import {
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
  intCV,
  bufferCV,
  principalCV,
  contractPrincipalCV,
  noneCV,
  someCV,
  tupleCV,
  listCV,
  trueCV,
  falseCV,
  ClarityValue as StacksClarityValue,
} from '@stacks/transactions'
import type { ClarityValue } from './types'

/**
 * Convert our simplified ClarityValue format to actual Stacks Clarity values
 */
export function toClarityValue(cv: ClarityValue): StacksClarityValue {
  switch (cv.type) {
    case 'uint':
      return uintCV(cv.value)

    case 'int':
      return intCV(cv.value)

    case 'string-ascii':
      return stringAsciiCV(cv.value)

    case 'string-utf8':
      return stringUtf8CV(cv.value)

    case 'buffer':
      if (typeof cv.value === 'string') {
        return bufferCV(Buffer.from(cv.value, 'hex'))
      }
      return bufferCV(cv.value)

    case 'principal':
      return principalCV(cv.value)

    case 'contract-principal':
      const [address, contractName] = cv.value.split('.')
      return contractPrincipalCV(address, contractName)

    case 'bool':
      return cv.value ? trueCV() : falseCV()

    case 'none':
      return noneCV()

    case 'some':
      return someCV(toClarityValue(cv.value))

    case 'tuple':
      const tupleData: Record<string, StacksClarityValue> = {}
      for (const [key, value] of Object.entries(cv.value)) {
        tupleData[key] = toClarityValue(value as ClarityValue)
      }
      return tupleCV(tupleData)

    case 'list':
      return listCV(cv.value.map((item: ClarityValue) => toClarityValue(item)))

    default:
      throw new Error(`Unsupported Clarity type: ${cv.type}`)
  }
}

/**
 * Convert an array of our ClarityValues to Stacks ClarityValues
 */
export function toClarityValueArray(cvs: ClarityValue[]): StacksClarityValue[] {
  return cvs.map(toClarityValue)
}

/**
 * Parse a contract identifier into address and name
 */
export function parseContractIdentifier(identifier: string): {
  address: string
  name: string
} {
  const [address, name] = identifier.split('.')
  if (!address || !name) {
    throw new Error(`Invalid contract identifier: ${identifier}`)
  }
  return { address, name }
}

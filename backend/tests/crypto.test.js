import { describe, it, expect } from 'vitest'
import { generateRandomToken, hashToken, timingSafeCompare } from '../src/utils/crypto.js'

describe('Crypto Utilities', () => {
  it('should generate random hex tokens of correct length', () => {
    const token = generateRandomToken(32)
    expect(token).toBeTypeOf('string')
    expect(token).toHaveLength(64) // 32 bytes = 64 hex characters
  })

  it('should generate deterministic SHA-256 hashes', () => {
    const hash1 = hashToken('test-token')
    const hash2 = hashToken('test-token')
    const hashOther = hashToken('other-token')

    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hashOther)
    expect(hash1).toHaveLength(64)
  })

  it('should perform timing safe string comparisons', () => {
    const strA = 'super-secret-token-123'
    const strB = 'super-secret-token-123'
    const strDiff = 'super-secret-token-456'
    const strShort = 'super-secret'

    expect(timingSafeCompare(strA, strB)).toBe(true)
    expect(timingSafeCompare(strA, strDiff)).toBe(false)
    expect(timingSafeCompare(strA, strShort)).toBe(false)
    expect(timingSafeCompare(null, strA)).toBe(false)
    expect(timingSafeCompare(strA, undefined)).toBe(false)
  })
})

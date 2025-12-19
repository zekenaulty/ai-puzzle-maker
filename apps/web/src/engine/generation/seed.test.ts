import { describe, expect, it } from 'vitest'
import { createSeededRng, normalizeSeed } from './seed'

describe('seed utilities', () => {
  it('normalizes zero seed to a non-zero default', () => {
    expect(normalizeSeed(0)).toBe(0x6d2b79f5)
  })

  it('produces deterministic sequences for the same seed', () => {
    const rngA = createSeededRng(123456)
    const rngB = createSeededRng(123456)

    const sequenceA = Array.from({ length: 5 }, () => rngA.next())
    const sequenceB = Array.from({ length: 5 }, () => rngB.next())

    expect(sequenceA).toEqual(sequenceB)
  })

  it('produces different sequences for different seeds', () => {
    const rngA = createSeededRng(111)
    const rngB = createSeededRng(222)

    expect(rngA.next()).not.toBe(rngB.next())
  })

  it('nextRange returns values within bounds', () => {
    const rng = createSeededRng(42)
    for (let i = 0; i < 20; i += 1) {
      const value = rng.nextRange(-2, 3)
      expect(value).toBeGreaterThanOrEqual(-2)
      expect(value).toBeLessThanOrEqual(3)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { hitTestPieces } from './selection'

describe('selection hit test', () => {
  it('returns the topmost piece by z-index', () => {
    const pieces = [
      { id: 'low', x: 0, y: 0, rotation: 0, width: 100, height: 100, zIndex: 1 },
      { id: 'high', x: 0, y: 0, rotation: 0, width: 100, height: 100, zIndex: 3 },
      { id: 'mid', x: 0, y: 0, rotation: 0, width: 100, height: 100, zIndex: 2 },
    ]

    const hit = hitTestPieces(pieces, { x: 0, y: 0 })
    expect(hit?.id).toBe('high')
  })

  it('respects rotation when testing hits', () => {
    const piece = { id: 'rotated', x: 0, y: 0, rotation: Math.PI / 2, width: 100, height: 40 }
    const hit = hitTestPieces([piece], { x: 0, y: 49 })
    expect(hit?.id).toBe('rotated')
  })

  it('returns null when point is outside the rotated bounds', () => {
    const piece = { id: 'flat', x: 0, y: 0, rotation: 0, width: 100, height: 40 }
    const hit = hitTestPieces([piece], { x: 0, y: 49 })
    expect(hit).toBeNull()
  })
})

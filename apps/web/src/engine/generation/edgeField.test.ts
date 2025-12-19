import { describe, expect, it } from 'vitest'
import { generateEdgeField } from './edgeField'
import { createSeededRng } from './seed'

describe('generateEdgeField', () => {
  it('creates the expected seam counts and orientations', () => {
    const rows = 2
    const cols = 3
    const seams = generateEdgeField({ rows, cols, rng: createSeededRng(123) })

    const verticalCount = seams.filter((seam) => seam.orientation === 'V').length
    const horizontalCount = seams.filter((seam) => seam.orientation === 'H').length

    expect(seams).toHaveLength(rows * (cols - 1) + (rows - 1) * cols)
    expect(verticalCount).toBe(rows * (cols - 1))
    expect(horizontalCount).toBe((rows - 1) * cols)
  })

  it('assigns seam endpoints based on orientation', () => {
    const rows = 2
    const cols = 3
    const seams = generateEdgeField({ rows, cols, rng: createSeededRng(321) })

    for (const seam of seams) {
      expect(Math.abs(seam.tab.sign)).toBe(1)
      if (seam.orientation === 'V') {
        expect(seam.bCell).toBe(seam.aCell + 1)
        expect(Math.floor(seam.aCell / cols)).toBe(Math.floor(seam.bCell / cols))
        expect(seam.p0).toEqual({ x: 1, y: 0 })
        expect(seam.p3).toEqual({ x: 1, y: 1 })
      } else {
        expect(seam.bCell).toBe(seam.aCell + cols)
        expect(Math.floor(seam.bCell / cols)).toBe(Math.floor(seam.aCell / cols) + 1)
        expect(seam.p0).toEqual({ x: 0, y: 1 })
        expect(seam.p3).toEqual({ x: 1, y: 1 })
      }
    }
  })

  it('is deterministic for the same seed', () => {
    const params = { rows: 2, cols: 3 }
    const seamsA = generateEdgeField({ ...params, rng: createSeededRng(777) })
    const seamsB = generateEdgeField({ ...params, rng: createSeededRng(777) })

    expect(JSON.stringify(seamsA)).toBe(JSON.stringify(seamsB))
  })
})

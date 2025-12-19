import { describe, expect, it } from 'vitest'
import { buildPuzzleTopology, buildTopologyFromSeams, computeGridSpec } from './pieceTopology'
import { createSeededRng } from './seed'
import type { Seam } from '../model/puzzleTypes'

describe('piece topology', () => {
  it('computes a perfect square grid when possible', () => {
    const grid = computeGridSpec(100, '1:1')
    expect(grid.rows).toBe(10)
    expect(grid.cols).toBe(10)
  })

  it('builds topology from seams with correct edge signs', () => {
    const seams: Seam[] = [
      {
        id: 0,
        aCell: 0,
        bCell: 1,
        orientation: 'V',
        p0: { x: 1, y: 0 },
        p1: { x: 1, y: 0.3 },
        p2: { x: 1, y: 0.7 },
        p3: { x: 1, y: 1 },
        tab: {
          centerT: 0.5,
          amplitude: 0.25,
          width: 0.4,
          shape: 'bezier',
          sign: 1,
        },
        jitter: 0.05,
      },
    ]

    const topology = buildTopologyFromSeams(1, 2, seams)
    const leftCell = topology.cells[0]
    const rightCell = topology.cells[1]

    expect(leftCell.edges.right.seamId).toBe(0)
    expect(leftCell.edges.right.sign).toBe(1)
    expect(leftCell.edges.right.isOuter).toBe(false)

    expect(rightCell.edges.left.seamId).toBe(0)
    expect(rightCell.edges.left.sign).toBe(-1)
    expect(rightCell.edges.left.isOuter).toBe(false)

    expect(leftCell.edges.left.isOuter).toBe(true)
    expect(rightCell.edges.right.isOuter).toBe(true)
    expect(leftCell.edges.top.isOuter).toBe(true)
    expect(leftCell.edges.bottom.isOuter).toBe(true)
  })

  it('builds a full topology for a seeded grid', () => {
    const topology = buildPuzzleTopology(9, '1:1', createSeededRng(999))
    expect(topology.rows).toBe(3)
    expect(topology.cols).toBe(3)
    expect(topology.cells).toHaveLength(9)
    expect(topology.seams).toHaveLength(12)
  })
})

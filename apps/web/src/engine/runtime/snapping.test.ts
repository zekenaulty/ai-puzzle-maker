import { describe, expect, it } from 'vitest'
import { buildTopologyFromSeams } from '../generation/pieceTopology'
import type { Seam } from '../model/puzzleTypes'
import { SpatialIndex } from './spatialIndex'
import { findSnapCandidate, getPieceAabb, type PieceState } from './snapping'

const simpleSeam: Seam = {
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
    width: 0.3,
    shape: 'bezier',
    sign: 1,
  },
  jitter: 0.05,
}

const topology = buildTopologyFromSeams(1, 2, [simpleSeam])

function makePiece(overrides: Partial<PieceState>): PieceState {
  return {
    id: 'piece',
    cellIndex: 0,
    x: 0,
    y: 0,
    rotation: 0,
    width: 100,
    height: 100,
    clusterId: 0,
    ...overrides,
  }
}

describe('snapping', () => {
  it('finds a snap candidate within tolerance', () => {
    const pieceA = makePiece({ id: 'a', cellIndex: 0, clusterId: 0, x: 0, y: 0 })
    const pieceB = makePiece({ id: 'b', cellIndex: 1, clusterId: 1, x: 104, y: 0 })
    const spatial = new SpatialIndex(120)
    spatial.insert(pieceA.id, getPieceAabb(pieceA))
    spatial.insert(pieceB.id, getPieceAabb(pieceB))

    const result = findSnapCandidate({
      pieces: [pieceA, pieceB],
      activeClusterId: 0,
      topology,
      cellWidth: 100,
      cellHeight: 100,
      spatialIndex: spatial,
      options: {
        translationTolerance: 8,
        rotationToleranceDegrees: 10,
      },
    })

    expect(result).not.toBeNull()
    expect(result?.pieceId).toBe('a')
    expect(result?.neighborId).toBe('b')
    expect(result?.translationError).toBeCloseTo(4, 3)
  })

  it('uses anchor offsets when computing snap deltas', () => {
    const pieceA = makePiece({
      id: 'a',
      cellIndex: 0,
      clusterId: 0,
      x: 0,
      y: 0,
      anchorOffset: { x: 20, y: 0 },
    })
    const pieceB = makePiece({
      id: 'b',
      cellIndex: 1,
      clusterId: 1,
      x: 140,
      y: 0,
      anchorOffset: { x: -20, y: 0 },
    })
    const spatial = new SpatialIndex(200)
    spatial.insert(pieceA.id, getPieceAabb(pieceA))
    spatial.insert(pieceB.id, getPieceAabb(pieceB))

    const result = findSnapCandidate({
      pieces: [pieceA, pieceB],
      activeClusterId: 0,
      topology,
      cellWidth: 100,
      cellHeight: 100,
      spatialIndex: spatial,
      options: {
        translationTolerance: 50,
        rotationToleranceDegrees: 10,
      },
    })

    expect(result).not.toBeNull()
    expect(result?.translationError).toBeCloseTo(0, 3)
  })

  it('rejects snaps when rotation exceeds tolerance', () => {
    const pieceA = makePiece({ id: 'a', cellIndex: 0, clusterId: 0, x: 0, y: 0, rotation: 0 })
    const pieceB = makePiece({
      id: 'b',
      cellIndex: 1,
      clusterId: 1,
      x: 100,
      y: 0,
      rotation: Math.PI / 2,
    })
    const spatial = new SpatialIndex(120)
    spatial.insert(pieceA.id, getPieceAabb(pieceA))
    spatial.insert(pieceB.id, getPieceAabb(pieceB))

    const result = findSnapCandidate({
      pieces: [pieceA, pieceB],
      activeClusterId: 0,
      topology,
      cellWidth: 100,
      cellHeight: 100,
      spatialIndex: spatial,
      options: {
        translationTolerance: 8,
        rotationToleranceDegrees: 10,
      },
    })

    expect(result).toBeNull()
  })
})

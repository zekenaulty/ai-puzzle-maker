import type { PuzzleTopology, Seam, SeamTab } from '../engine/model/puzzleTypes'
import { buildTopologyFromSeams } from '../engine/generation/pieceTopology'

const defaultTab: SeamTab = {
  centerT: 0.5,
  amplitude: 0.25,
  width: 0.4,
  shape: 'bezier',
  sign: 1,
}

export function makeSeam(overrides: Partial<Seam> = {}): Seam {
  const { tab: tabOverride, ...rest } = overrides
  const tab = { ...defaultTab, ...(tabOverride ?? {}) }

  return {
    id: 0,
    aCell: 0,
    bCell: 1,
    orientation: 'V',
    p0: { x: 0, y: 0 },
  p1: { x: 0.3, y: 0.05 },
  p2: { x: 0.7, y: 0.95 },
  p3: { x: 1, y: 1 },
  jitter: 0.1,
  ...rest,
  tab,
}
}

export function makeTopology(rows: number, cols: number, seams: Seam[]): PuzzleTopology {
  return buildTopologyFromSeams(rows, cols, seams)
}

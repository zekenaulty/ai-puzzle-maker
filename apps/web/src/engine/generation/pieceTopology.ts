import type { AspectRatio } from '../../storage/types'
import type { CellTopology, EdgeSpec, PuzzleTopology, Seam } from '../model/puzzleTypes'
import type { SeededRng } from './seed'
import { generateEdgeField } from './edgeField'

export type GridSpec = {
  rows: number
  cols: number
}

export function computeGridSpec(pieceCount: number, aspectRatio: AspectRatio): GridSpec {
  const target = Math.max(1, Math.floor(pieceCount))
  const ratio = parseAspectRatio(aspectRatio)
  let bestRows = 1
  let bestCols = Math.max(1, Math.round(ratio))
  let bestScore = Number.POSITIVE_INFINITY

  for (let rows = 1; rows <= target; rows += 1) {
    const cols = Math.max(1, Math.round(rows * ratio))
    const countDelta = Math.abs(rows * cols - target)
    const ratioDelta = Math.abs(cols / rows - ratio)
    const score = countDelta * 10 + ratioDelta

    if (score < bestScore) {
      bestScore = score
      bestRows = rows
      bestCols = cols
    }
  }

  return { rows: bestRows, cols: bestCols }
}

export function buildPuzzleTopology(
  pieceCount: number,
  aspectRatio: AspectRatio,
  rng: SeededRng,
): PuzzleTopology {
  const { rows, cols } = computeGridSpec(pieceCount, aspectRatio)
  const seams = generateEdgeField({ rows, cols, rng })
  return buildTopologyFromSeams(rows, cols, seams)
}

export function buildTopologyFromSeams(rows: number, cols: number, seams: Seam[]): PuzzleTopology {
  const seamMaps = buildSeamMaps(seams, cols)
  const cells: CellTopology[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col
      const edges = {
        top: resolveTopEdge(row, col, seamMaps),
        right: resolveRightEdge(row, col, cols, seamMaps),
        bottom: resolveBottomEdge(row, col, rows, seamMaps),
        left: resolveLeftEdge(row, col, seamMaps),
      }

      cells.push({
        row,
        col,
        index,
        edges,
      })
    }
  }

  return {
    rows,
    cols,
    seams,
    cells,
  }
}

function buildSeamMaps(seams: Seam[], cols: number) {
  const vertical = new Map<string, Seam>()
  const horizontal = new Map<string, Seam>()

  for (const seam of seams) {
    const row = Math.floor(seam.aCell / cols)
    const col = seam.aCell % cols
    const key = `${col}:${row}`

    if (seam.orientation === 'V') {
      vertical.set(key, seam)
    } else {
      horizontal.set(key, seam)
    }
  }

  return { vertical, horizontal }
}

function resolveTopEdge(row: number, col: number, maps: { horizontal: Map<string, Seam> }): EdgeSpec {
  if (row === 0) {
    return outerEdge('H')
  }

  const seam = maps.horizontal.get(`${col}:${row - 1}`)
  if (!seam) {
    return outerEdge('H')
  }

  return seamEdge(seam, seam.tab.sign)
}

function resolveRightEdge(
  row: number,
  col: number,
  cols: number,
  maps: { vertical: Map<string, Seam> },
): EdgeSpec {
  if (col === cols - 1) {
    return outerEdge('V')
  }

  const seam = maps.vertical.get(`${col}:${row}`)
  if (!seam) {
    return outerEdge('V')
  }

  return seamEdge(seam, seam.tab.sign)
}

function resolveBottomEdge(
  row: number,
  col: number,
  rows: number,
  maps: { horizontal: Map<string, Seam> },
): EdgeSpec {
  if (row === rows - 1) {
    return outerEdge('H')
  }

  const seam = maps.horizontal.get(`${col}:${row}`)
  if (!seam) {
    return outerEdge('H')
  }

  return seamEdge(seam, seam.tab.sign)
}

function resolveLeftEdge(row: number, col: number, maps: { vertical: Map<string, Seam> }): EdgeSpec {
  if (col === 0) {
    return outerEdge('V')
  }

  const seam = maps.vertical.get(`${col - 1}:${row}`)
  if (!seam) {
    return outerEdge('V')
  }

  return seamEdge(seam, seam.tab.sign)
}

function outerEdge(orientation: 'H' | 'V'): EdgeSpec {
  return {
    orientation,
    isOuter: true,
    sign: 1,
  }
}

function seamEdge(seam: Seam, sign: 1 | -1): EdgeSpec {
  return {
    seamId: seam.id,
    orientation: seam.orientation,
    isOuter: false,
    sign,
  }
}

function invertSign(sign: 1 | -1): 1 | -1 {
  return sign === 1 ? -1 : 1
}

function parseAspectRatio(aspectRatio: AspectRatio): number {
  const [w, h] = aspectRatio.split(':').map(Number)
  if (!w || !h) {
    return 1
  }
  return w / h
}

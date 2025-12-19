import type { PuzzleTopology } from '../model/puzzleTypes'
import { expandAabb, type Aabb, type SpatialIndex } from './spatialIndex'

export type PieceState = {
  id: string
  cellIndex: number
  x: number
  y: number
  rotation: number
  width: number
  height: number
  clusterId: number
  anchorOffset?: { x: number; y: number }
}

export type NeighborInfo = {
  neighborCell: number
  seamId: number
  orientation: 'H' | 'V'
}

export type NeighborGraph = Map<number, NeighborInfo[]>

export type SnapOptions = {
  translationTolerance: number
  rotationToleranceDegrees: number
  maxNeighborDistance?: number
}

export type SnapResult = {
  pieceId: string
  neighborId: string
  deltaX: number
  deltaY: number
  translationError: number
  rotationError: number
}

export function buildNeighborGraph(topology: PuzzleTopology): NeighborGraph {
  const graph: NeighborGraph = new Map()
  const rows = topology.rows
  const cols = topology.cols

  const addNeighbor = (from: number, to: number, seamId: number, orientation: 'H' | 'V') => {
    const list = graph.get(from) ?? []
    list.push({ neighborCell: to, seamId, orientation })
    graph.set(from, list)
  }

  for (const seam of topology.seams) {
    const aCell = seam.aCell
    const bCell = seam.bCell
    addNeighbor(aCell, bCell, seam.id, seam.orientation)
    addNeighbor(bCell, aCell, seam.id, seam.orientation)
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col
      if (!graph.has(index)) {
        graph.set(index, [])
      }
    }
  }

  return graph
}

export function findSnapCandidate(params: {
  pieces: PieceState[]
  activeClusterId: number
  topology: PuzzleTopology
  cellWidth: number
  cellHeight: number
  spatialIndex: SpatialIndex
  options: SnapOptions
  neighborGraph?: NeighborGraph
}): SnapResult | null {
  const { pieces, activeClusterId, topology, cellWidth, cellHeight, spatialIndex, options } = params
  const neighborGraph = params.neighborGraph ?? buildNeighborGraph(topology)
  const piecesByCell = new Map(pieces.map((piece) => [piece.cellIndex, piece]))
  const clusterPieces = pieces.filter((piece) => piece.clusterId === activeClusterId)

  if (clusterPieces.length === 0) {
    return null
  }

  const clusterBounds = computeClusterBounds(clusterPieces)
  const queryBounds = expandAabb(clusterBounds, options.translationTolerance)
  const nearbyIds = spatialIndex.query(queryBounds)

  let best: SnapResult | null = null

  for (const piece of clusterPieces) {
    const neighbors = neighborGraph.get(piece.cellIndex) ?? []
    for (const neighborInfo of neighbors) {
      const neighborPiece = piecesByCell.get(neighborInfo.neighborCell)
      if (!neighborPiece || neighborPiece.clusterId === activeClusterId) {
        continue
      }
      if (!nearbyIds.has(neighborPiece.id)) {
        continue
      }

      const rotationError = angleDistance(piece.rotation, neighborPiece.rotation)
      if (rotationError > degreesToRadians(options.rotationToleranceDegrees)) {
        continue
      }

      const expectedOffset = getCellOffset(
        piece.cellIndex,
        neighborPiece.cellIndex,
        topology.cols,
        cellWidth,
        cellHeight,
      )
      const rotatedOffset = rotateVec(expectedOffset, piece.rotation)
      const pieceAnchor = getAnchorPosition(piece)
      const neighborAnchor = getAnchorPosition(neighborPiece)
      const expectedNeighborPos = {
        x: pieceAnchor.x + rotatedOffset.x,
        y: pieceAnchor.y + rotatedOffset.y,
      }

      const dx = neighborAnchor.x - expectedNeighborPos.x
      const dy = neighborAnchor.y - expectedNeighborPos.y
      const translationError = Math.hypot(dx, dy)

      if (translationError > options.translationTolerance) {
        continue
      }

      const maxDistance =
        options.maxNeighborDistance ?? Math.max(cellWidth, cellHeight) * 1.6
      if (!isPlausibleNeighborDistance(piece, neighborPiece, maxDistance)) {
        continue
      }

      if (!best || translationError < best.translationError) {
        best = {
          pieceId: piece.id,
          neighborId: neighborPiece.id,
          deltaX: dx,
          deltaY: dy,
          translationError,
          rotationError,
        }
      }
    }
  }

  return best
}

export function getPieceAabb(piece: PieceState): Aabb {
  const halfW = piece.width / 2
  const halfH = piece.height / 2
  const cos = Math.cos(piece.rotation)
  const sin = Math.sin(piece.rotation)
  const extentX = Math.abs(halfW * cos) + Math.abs(halfH * sin)
  const extentY = Math.abs(halfW * sin) + Math.abs(halfH * cos)
  return {
    minX: piece.x - extentX,
    minY: piece.y - extentY,
    maxX: piece.x + extentX,
    maxY: piece.y + extentY,
  }
}

export function computeClusterBounds(pieces: PieceState[]): Aabb {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const piece of pieces) {
    const bounds = getPieceAabb(piece)
    minX = Math.min(minX, bounds.minX)
    minY = Math.min(minY, bounds.minY)
    maxX = Math.max(maxX, bounds.maxX)
    maxY = Math.max(maxY, bounds.maxY)
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  return { minX, minY, maxX, maxY }
}

function isPlausibleNeighborDistance(
  piece: PieceState,
  neighbor: PieceState,
  maxDistance: number,
): boolean {
  const dx = neighbor.x - piece.x
  const dy = neighbor.y - piece.y
  return Math.hypot(dx, dy) <= maxDistance
}

function getCellOffset(
  cellIndex: number,
  neighborIndex: number,
  cols: number,
  cellWidth: number,
  cellHeight: number,
): { x: number; y: number } {
  const row = Math.floor(cellIndex / cols)
  const col = cellIndex % cols
  const neighborRow = Math.floor(neighborIndex / cols)
  const neighborCol = neighborIndex % cols
  return {
    x: (neighborCol - col) * cellWidth,
    y: (neighborRow - row) * cellHeight,
  }
}

function rotateVec(vec: { x: number; y: number }, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: vec.x * cos - vec.y * sin,
    y: vec.x * sin + vec.y * cos,
  }
}

function getAnchorPosition(piece: PieceState): { x: number; y: number } {
  if (!piece.anchorOffset) {
    return { x: piece.x, y: piece.y }
  }
  const rotated = rotateVec(piece.anchorOffset, piece.rotation)
  return {
    x: piece.x + rotated.x,
    y: piece.y + rotated.y,
  }
}

function angleDistance(a: number, b: number): number {
  let diff = Math.abs(a - b) % (Math.PI * 2)
  if (diff > Math.PI) {
    diff = Math.PI * 2 - diff
  }
  return diff
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

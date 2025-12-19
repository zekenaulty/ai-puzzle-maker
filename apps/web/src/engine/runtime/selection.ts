export type SelectionState = {
  pieceId: string | null
  clusterId: number | null
}

export type PickablePiece = {
  id: string
  x: number
  y: number
  rotation: number
  width: number
  height: number
  zIndex?: number
}

export type Vec2 = {
  x: number
  y: number
}

export function createSelectionState(): SelectionState {
  return { pieceId: null, clusterId: null }
}

export function selectPiece(pieceId: string, clusterId: number): SelectionState {
  return { pieceId, clusterId }
}

export function clearSelection(): SelectionState {
  return { pieceId: null, clusterId: null }
}

export function isSelected(state: SelectionState, pieceId: string): boolean {
  return state.pieceId === pieceId
}

export function hitTestPieces(pieces: PickablePiece[], point: Vec2): PickablePiece | null {
  const sorted = [...pieces].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
  for (const piece of sorted) {
    if (pointInRotatedRect(point, piece)) {
      return piece
    }
  }
  return null
}

function pointInRotatedRect(point: Vec2, piece: PickablePiece): boolean {
  const dx = point.x - piece.x
  const dy = point.y - piece.y
  const cos = Math.cos(-piece.rotation)
  const sin = Math.sin(-piece.rotation)
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos
  return Math.abs(localX) <= piece.width / 2 && Math.abs(localY) <= piece.height / 2
}

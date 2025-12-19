import type { AspectRatio } from '../../storage/types'

export type Vec2 = {
  x: number
  y: number
}

export type PuzzleBoard = {
  width: number
  height: number
  padding: number
}

export type PuzzleConfig = {
  imageId: string
  seed: number
  aspectRatio: AspectRatio
  pieceCount: number
  generatorVersion: string
}

export type SeamOrientation = 'H' | 'V'

export type SeamTab = {
  centerT: number
  amplitude: number
  width: number
  shape: 'bezier'
  sign: 1 | -1
}

export type Seam = {
  id: number
  aCell: number
  bCell: number
  orientation: SeamOrientation
  p0: Vec2
  p1: Vec2
  p2: Vec2
  p3: Vec2
  tab: SeamTab
  jitter: number
}

export type EdgeSpec = {
  seamId?: number
  orientation: SeamOrientation
  isOuter: boolean
  sign: 1 | -1
}

export type CellTopology = {
  row: number
  col: number
  index: number
  edges: {
    top: EdgeSpec
    right: EdgeSpec
    bottom: EdgeSpec
    left: EdgeSpec
  }
}

export type PuzzleTopology = {
  rows: number
  cols: number
  seams: Seam[]
  cells: CellTopology[]
}

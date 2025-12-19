import type { Seam } from '../engine/model/puzzleTypes'

export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | '2:3'

export type ImageSource = 'generated' | 'uploaded'

export type ImagePromptMeta = {
  model?: string
  promptUsed?: string
  styleTags?: string[]
  moodTags?: string[]
  paletteTags?: string[]
  baseTemplateId?: string
  negativeConstraints?: string[]
  title?: string
  altText?: string
}

export type ImageRecord = {
  imageId: string
  createdAt: number
  source: ImageSource
  mime: string
  blob: Blob
  width: number
  height: number
  previewBlob?: Blob
  promptMeta?: ImagePromptMeta
}

export type PuzzleBoard = {
  width: number
  height: number
  padding: number
}

export type PuzzleEdges = {
  rows: number
  cols: number
  seams: Seam[]
}

export type PuzzleRecord = {
  puzzleId: string
  imageId: string
  seed: number
  pieceCount: number
  generatorVersion: string
  board: PuzzleBoard
  edges: PuzzleEdges
  createdAt: number
  aspectRatio?: AspectRatio
}

export type PuzzleProgressView = {
  scale: number
  tx: number
  ty: number
}

export type ProgressRecord = {
  puzzleId: string
  pieces: unknown
  clusters: unknown
  view: PuzzleProgressView
  lastSavedAt: number
  completedAt?: number
}

export type SettingsAccessibility = {
  highContrast: boolean
  reducedMotion: boolean
}

export type SettingsRecord = {
  key: 'global'
  snappingTolerance: number
  rotationEnabled: boolean
  rotationStep: number
  backgroundGuideOpacity: number
  preferredAspectRatio: AspectRatio
  defaultPieceCount: number
  accessibility: SettingsAccessibility
}

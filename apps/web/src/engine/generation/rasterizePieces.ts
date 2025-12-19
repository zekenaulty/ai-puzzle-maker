import type { PuzzleTopology, Vec2 } from '../model/puzzleTypes'
import { buildPiecePathPoints } from './piecePath'

export type PieceRaster = {
  cellIndex: number
  bitmap: ImageBitmap
  width: number
  height: number
  offsetX: number
  offsetY: number
  path: Path2D
}

export type RasterizeOptions = {
  samplesPerEdge?: number
  oversample?: number
  padding?: number
  strokeWidth?: number
}

export async function rasterizePieces(
  image: CanvasImageSource,
  imageSize: { width: number; height: number },
  topology: PuzzleTopology,
  options: RasterizeOptions = {},
): Promise<PieceRaster[]> {
  const pieces: PieceRaster[] = []
  const cellWidth = imageSize.width / topology.cols
  const cellHeight = imageSize.height / topology.rows
  const samplesPerEdge = options.samplesPerEdge ?? 28
  const oversample = options.oversample ?? 2
  const padding = options.padding ?? Math.max(cellWidth, cellHeight) * 0.12
  const strokeWidth = options.strokeWidth ?? Math.max(1, Math.min(cellWidth, cellHeight) * 0.035)

  for (const cell of topology.cells) {
    const localPoints = buildPiecePathPoints(cell, topology, { samplesPerEdge })
    const worldPoints = localPoints.map((point) => ({
      x: (cell.col + point.x) * cellWidth,
      y: (cell.row + point.y) * cellHeight,
    }))

    const bounds = getBounds(worldPoints)
    const width = Math.ceil(bounds.maxX - bounds.minX + padding * 2)
    const height = Math.ceil(bounds.maxY - bounds.minY + padding * 2)

    const renderCanvas = createCanvas(width * oversample, height * oversample)
    const renderCtx = getContext2d(renderCanvas)
    renderCtx.scale(oversample, oversample)
    renderCtx.translate(-bounds.minX + padding, -bounds.minY + padding)

    const path = buildPathFromPoints(worldPoints)
    renderCtx.save()
    renderCtx.clip(path)
    renderCtx.drawImage(image, 0, 0, imageSize.width, imageSize.height)
    renderCtx.restore()

    renderCtx.lineJoin = 'round'
    renderCtx.lineCap = 'round'
    renderCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)'
    renderCtx.lineWidth = strokeWidth
    renderCtx.stroke(path)

    renderCtx.save()
    renderCtx.globalCompositeOperation = 'source-atop'
    renderCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    renderCtx.lineWidth = strokeWidth * 2.2
    renderCtx.stroke(path)
    renderCtx.restore()

    const finalCanvas = oversample > 1 ? createCanvas(width, height) : renderCanvas
    if (oversample > 1) {
      const finalCtx = getContext2d(finalCanvas)
      finalCtx.drawImage(renderCanvas as CanvasImageSource, 0, 0, width, height)
    }

    const bitmap = await createImageBitmap(finalCanvas as CanvasImageSource)

    pieces.push({
      cellIndex: cell.index,
      bitmap,
      width,
      height,
      offsetX: bounds.minX - padding,
      offsetY: bounds.minY - padding,
      path,
    })
  }

  return pieces
}

function getBounds(points: Vec2[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  return { minX, minY, maxX, maxY }
}

function buildPathFromPoints(points: Vec2[]): Path2D {
  const path = new Path2D()
  if (points.length === 0) {
    return path
  }

  path.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i += 1) {
    path.lineTo(points[i].x, points[i].y)
  }
  path.closePath()
  return path
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement

function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  if (typeof document === 'undefined') {
    throw new Error('No canvas implementation available')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function getContext2d(canvas: CanvasLike): Canvas2DContext {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2D context not available')
  }
  return ctx
}

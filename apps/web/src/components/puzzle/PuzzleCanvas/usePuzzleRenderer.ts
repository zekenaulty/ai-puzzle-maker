import { useEffect, useRef } from 'react'
import type { ViewTransform } from './viewTransform'
import { applyViewTransform } from './viewTransform'
import { LruCache } from '../../../utils/lruCache'

export type RenderPiece = {
  id: string
  bitmap?: ImageBitmap
  x: number
  y: number
  rotation: number
  width: number
  height: number
  zIndex?: number
  isDragging?: boolean
}

export type PuzzleScene = {
  pieces: RenderPiece[]
  view: ViewTransform
  background?: {
    color?: string
    image?: CanvasImageSource
    width?: number
    height?: number
    opacity?: number
  }
  board?: {
    width: number
    height: number
    padding?: number
  }
}

export type UsePuzzleRendererOptions = {
  maxBitmapCache?: number
  backgroundColor?: string
}

export function usePuzzleRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  scene: PuzzleScene,
  options: UsePuzzleRendererOptions = {},
) {
  const sceneRef = useRef(scene)
  const optionsRef = useRef(options)
  const pixelRatioRef = useRef(1)
  const cacheRef = useRef(
    new LruCache<string, ImageBitmap>(options.maxBitmapCache ?? 1024),
  )

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return undefined
    }

    const updateSize = () => {
      pixelRatioRef.current = resizeCanvas(canvas)
    }

    updateSize()

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateSize())
      resizeObserver.observe(canvas)
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateSize)
    }

    let frameId = 0
    let isRunning = true

    const renderLoop = () => {
      if (!isRunning) {
        return
      }

      renderFrame(ctx, sceneRef.current, optionsRef.current, cacheRef.current, pixelRatioRef.current)
      frameId = requestAnimationFrame(renderLoop)
    }

    frameId = requestAnimationFrame(renderLoop)

    return () => {
      isRunning = false
      cancelAnimationFrame(frameId)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateSize)
      }
    }
  }, [canvasRef])
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  scene: PuzzleScene,
  options: UsePuzzleRendererOptions,
  cache: LruCache<string, ImageBitmap>,
  pixelRatio: number,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const backgroundColor = scene.background?.color ?? options.backgroundColor ?? '#11151a'
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.save()
  applyViewTransform(ctx, scene.view, pixelRatio)
  ctx.imageSmoothingEnabled = true

  if (scene.background?.image && scene.background.width && scene.background.height) {
    ctx.save()
    ctx.globalAlpha = scene.background.opacity ?? 0.25
    try {
      ctx.drawImage(scene.background.image, 0, 0, scene.background.width, scene.background.height)
    } catch (err) {
      console.warn('Failed to draw background image, skipping frame', err)
    }
    ctx.restore()
  }

  if (scene.board) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1 / scene.view.scale
    const padding = scene.board.padding ?? 0
    ctx.strokeRect(
      -padding,
      -padding,
      scene.board.width + padding * 2,
      scene.board.height + padding * 2,
    )
    ctx.restore()
  }

  const pieces = [...scene.pieces].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  for (const piece of pieces) {
    const bitmap = getBitmap(piece, cache)
    if (!bitmap) {
      continue
    }

    ctx.save()
    if (piece.isDragging) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
      ctx.shadowBlur = 18 / scene.view.scale
      ctx.shadowOffsetY = 6 / scene.view.scale
    }
    ctx.translate(piece.x, piece.y)
    ctx.rotate(piece.rotation)
    try {
      ctx.drawImage(bitmap, -piece.width / 2, -piece.height / 2, piece.width, piece.height)
    } catch (err) {
      console.warn('Failed to draw piece bitmap, skipping', piece.id, err)
    }
    ctx.restore()
  }

  ctx.restore()
}

function getBitmap(piece: RenderPiece, cache: LruCache<string, ImageBitmap>): ImageBitmap | undefined {
  if (piece.bitmap) {
    cache.set(piece.id, piece.bitmap)
    return piece.bitmap
  }
  return cache.get(piece.id)
}

function resizeCanvas(canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect()
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const width = Math.max(1, Math.floor(rect.width * pixelRatio))
  const height = Math.max(1, Math.floor(rect.height * pixelRatio))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  return pixelRatio
}

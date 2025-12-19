export type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  release?: () => void
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(blob)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    }
  }

  if (typeof document === 'undefined') {
    throw new Error('No image decoder available')
  }

  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  try {
    await decodeHtmlImage(image)
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  }
}

export async function createPreviewBlob(
  blob: Blob,
  maxSize = 480,
  mimeType = 'image/webp',
): Promise<Blob | null> {
  const decoded = await decodeImage(blob)
  const scale = Math.min(1, maxSize / Math.max(decoded.width, decoded.height))
  const width = Math.max(1, Math.round(decoded.width * scale))
  const height = Math.max(1, Math.round(decoded.height * scale))

  const canvas = createCanvas(width, height)
  const ctx = getContext2d(canvas)
  ctx.drawImage(decoded.source, 0, 0, width, height)
  decoded.release?.()

  const preview = await canvasToBlob(canvas, mimeType)
  if (preview) {
    return preview
  }

  return canvasToBlob(canvas, 'image/png')
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement
type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

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

function getContext2d(canvas: CanvasLike): Canvas2DContext {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2D context not available')
  }
  return ctx
}

function canvasToBlob(canvas: CanvasLike, type: string): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type, quality: 0.82 })
  }

  return new Promise((resolve) => {
    if (!('toBlob' in canvas)) {
      resolve(null)
      return
    }
    ;(canvas as HTMLCanvasElement).toBlob(
      (blob) => resolve(blob),
      type,
      0.82,
    )
  })
}

function decodeHtmlImage(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode === 'function') {
    return image.decode()
  }

  return new Promise((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image failed to load'))
  })
}

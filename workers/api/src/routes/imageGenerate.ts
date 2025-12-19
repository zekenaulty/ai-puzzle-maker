import type { Env } from '../index'
import { errorResponse, jsonResponse } from '../http'
import { createGeminiClient, GeminiApiError } from '../gemini/geminiClient'
import type { GeminiGenerateContentRequest } from '../gemini/contracts'
import { getStyleTag } from '../gemini/styleTaxonomy'

const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '4:3', '16:9', '9:16', '3:2', '2:3'])
const ALLOWED_IMAGE_MODELS = new Set(['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'])

type ImageGenerateRequest =
  | {
      kind: 'default'
      finalPrompt: string
      negativeConstraints: string[]
      aspectRatio: string
      imageModel: string
    }
  | {
      kind: 'user'
      userPrompt: string
      styleTags?: string[]
      aspectRatio: string
      imageModel: string
    }

export async function handleImageGenerate(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method not allowed')
  }

  let payload: ImageGenerateRequest
  try {
    payload = (await request.json()) as ImageGenerateRequest
  } catch {
    return errorResponse(400, 'Invalid JSON payload')
  }

  const validation = validatePayload(payload)
  if (!validation.ok) {
    return errorResponse(400, 'Invalid request', { issues: validation.issues })
  }

  const promptUsed = buildPrompt(payload)
  const requestBody: GeminiGenerateContentRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptUsed }],
      },
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: payload.aspectRatio,
      },
    },
  }

  const client = createGeminiClient(env)

  try {
    const response = await client.generateContent(payload.imageModel, requestBody)
    const imagePart = extractInlineImage(response)
    if (!imagePart) {
      return errorResponse(502, 'Image model returned no image data')
    }

    const imageBase64 = imagePart.inlineData.data
    const imageMimeType = imagePart.inlineData.mimeType || 'image/png'
    const dimensions = getImageDimensions(imageMimeType, imageBase64)

    return jsonResponse({
      imageMimeType,
      imageBase64,
      width: dimensions.width,
      height: dimensions.height,
      promptUsed,
      model: payload.imageModel,
    })
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return errorResponse(502, error.message)
    }

    const message = error instanceof Error ? error.message : 'Unexpected error'
    return errorResponse(500, message)
  }
}

function validatePayload(payload: ImageGenerateRequest): { ok: true } | { ok: false; issues: string[] } {
  const issues: string[] = []

  if (!payload || typeof payload !== 'object') {
    return { ok: false, issues: ['Payload must be an object'] }
  }

  if (payload.kind !== 'default' && payload.kind !== 'user') {
    issues.push('kind must be "default" or "user"')
  }

  if (!ALLOWED_ASPECT_RATIOS.has(payload.aspectRatio)) {
    issues.push('aspectRatio is invalid')
  }

  if (!ALLOWED_IMAGE_MODELS.has(payload.imageModel)) {
    issues.push('imageModel is not allowed')
  }

  if (payload.kind === 'default') {
    if (typeof payload.finalPrompt !== 'string' || !payload.finalPrompt.trim()) {
      issues.push('finalPrompt is required')
    }
    if (!Array.isArray(payload.negativeConstraints)) {
      issues.push('negativeConstraints must be an array of strings')
    } else {
      for (const item of payload.negativeConstraints) {
        if (typeof item !== 'string') {
          issues.push('negativeConstraints must be an array of strings')
          break
        }
      }
    }
  }

  if (payload.kind === 'user') {
    if (typeof payload.userPrompt !== 'string' || !payload.userPrompt.trim()) {
      issues.push('userPrompt is required')
    }
    if (payload.styleTags !== undefined) {
      if (!Array.isArray(payload.styleTags)) {
        issues.push('styleTags must be an array of strings')
      } else {
        for (const tagId of payload.styleTags) {
          if (typeof tagId !== 'string' || !getStyleTag(tagId)) {
            issues.push(`styleTags contains invalid id: ${String(tagId)}`)
          }
        }
      }
    }
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true }
}

function buildPrompt(payload: ImageGenerateRequest): string {
  const guardrails = [
    'Create an original, copyright-safe scene.',
    'Do not include copyrighted characters, logos, brand names, or trademarks.',
    'Do not mention living artists.',
    'Avoid recognizable IP.',
    'Avoid text overlays unless explicitly requested.',
  ]

  if (payload.kind === 'default') {
    const negatives =
      payload.negativeConstraints.length > 0
        ? `Avoid: ${payload.negativeConstraints.join(', ')}.`
        : ''
    return [payload.finalPrompt.trim(), negatives, ...guardrails].filter(Boolean).join(' ')
  }

  const styleLine =
    payload.styleTags && payload.styleTags.length > 0
      ? `Style tags: ${payload.styleTags.map((id) => getStyleTag(id)!.label).join(', ')}.`
      : ''
  return [payload.userPrompt.trim(), styleLine, ...guardrails].filter(Boolean).join(' ')
}

function extractInlineImage(response: {
  candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }>
}): { inlineData: { data: string; mimeType: string } } | null {
  const candidates = response.candidates ?? []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return { inlineData: part.inlineData }
      }
    }
  }
  return null
}

function getImageDimensions(mimeType: string, base64: string): { width: number; height: number } {
  const bytes = base64ToBytes(base64)
  if (mimeType === 'image/png') {
    const png = parsePngDimensions(bytes)
    if (png) {
      return png
    }
  }

  if (mimeType === 'image/webp') {
    const webp = parseWebpDimensions(bytes)
    if (webp) {
      return webp
    }
  }

  return { width: 0, height: 0 }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function parsePngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) {
    return null
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (bytes[i] !== pngSignature[i]) {
      return null
    }
  }

  const width = readUint32BE(bytes, 16)
  const height = readUint32BE(bytes, 20)
  if (width <= 0 || height <= 0) {
    return null
  }

  return { width, height }
}

function parseWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) {
    return null
  }

  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    return null
  }

  const chunkType = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15])
  if (chunkType === 'VP8X') {
    const width = 1 + readUint24LE(bytes, 24)
    const height = 1 + readUint24LE(bytes, 27)
    return { width, height }
  }

  if (chunkType === 'VP8 ') {
    if (bytes.length < 30) {
      return null
    }
    const width = bytes[26] | (bytes[27] << 8)
    const height = bytes[28] | (bytes[29] << 8)
    return { width, height }
  }

  return null
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

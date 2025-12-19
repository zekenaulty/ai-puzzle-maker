import type { Env } from '../index'
import type {
  GeminiErrorResponse,
  GeminiGenerateContentRequest,
  GeminiGenerateContentResponse,
} from './contracts'

export type GeminiClient = {
  generateContent: (
    model: string,
    body: GeminiGenerateContentRequest,
  ) => Promise<GeminiGenerateContentResponse>
}

export class GeminiApiError extends Error {
  status: number
  payload?: GeminiErrorResponse | string

  constructor(message: string, status: number, payload?: GeminiErrorResponse | string) {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
    this.payload = payload
  }
}

export function createGeminiClient(env: Env): GeminiClient {
  const apiKey = env.AI_PUZZLE_MAKER__GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing AI_PUZZLE_MAKER__GEMINI_API_KEY')
  }

  const baseUrl = env.AI_PUZZLE_MAKER__GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'
  const trimmedBase = baseUrl.replace(/\/+$/, '')

  return {
    async generateContent(model, body) {
      const url = `${trimmedBase}/v1beta/models/${model}:generateContent`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const payload = await readErrorPayload(response)
        const message = payloadMessage(payload) || `Gemini API error (${response.status})`
        throw new GeminiApiError(message, response.status, payload)
      }

      return (await response.json()) as GeminiGenerateContentResponse
    },
  }
}

async function readErrorPayload(response: Response): Promise<GeminiErrorResponse | string> {
  try {
    return (await response.json()) as GeminiErrorResponse
  } catch {
    try {
      return await response.text()
    } catch {
      return ''
    }
  }
}

function payloadMessage(payload: GeminiErrorResponse | string): string | null {
  if (!payload) {
    return null
  }

  if (typeof payload === 'string') {
    return payload.trim() || null
  }

  return payload.error?.message ?? null
}

import type { Env } from '../index'
import { errorResponse, jsonResponse } from '../http'
import { createGeminiClient, GeminiApiError } from '../gemini/geminiClient'
import type { GeminiGenerateContentRequest } from '../gemini/contracts'
import {
  getBaseTemplate,
  getMoodTag,
  getPaletteTag,
  getStyleTag,
} from '../gemini/styleTaxonomy'

const MODEL_ID = 'gemini-2.5-flash'
const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '4:3', '16:9', '9:16', '3:2', '2:3'])

type PromptComposeRequest = {
  baseTemplateId: string
  styleTags: string[]
  moodTags?: string[]
  paletteTags?: string[]
  extraDetails?: string
  aspectRatio: string
}

export async function handlePromptCompose(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method not allowed')
  }

  let payload: PromptComposeRequest
  try {
    payload = (await request.json()) as PromptComposeRequest
  } catch {
    return errorResponse(400, 'Invalid JSON payload')
  }

  const validation = validatePayload(payload)
  if (!validation.ok) {
    return errorResponse(400, 'Invalid request', { issues: validation.issues })
  }

  const baseTemplate = getBaseTemplate(payload.baseTemplateId)!
  const styleLabels = payload.styleTags.map((id) => getStyleTag(id)!.label)
  const moodLabels = (payload.moodTags ?? []).map((id) => getMoodTag(id)!.label)
  const paletteLabels = (payload.paletteTags ?? []).map((id) => getPaletteTag(id)!.label)

  const promptLines = [
    `Base template: ${baseTemplate.prompt}.`,
    `Style tags: ${styleLabels.join(', ')}.`,
    `Target aspect ratio: ${payload.aspectRatio}.`,
  ]

  if (moodLabels.length > 0) {
    promptLines.push(`Mood tags: ${moodLabels.join(', ')}.`)
  }

  if (paletteLabels.length > 0) {
    promptLines.push(`Palette tags: ${paletteLabels.join(', ')}.`)
  }

  if (payload.extraDetails?.trim()) {
    promptLines.push(`Extra details: ${payload.extraDetails.trim()}.`)
  }

  const client = createGeminiClient(env)
  const requestBody: GeminiGenerateContentRequest = {
    system_instruction: {
      parts: [
        {
          text:
            'You are a prompt composer for a jigsaw puzzle image generator. ' +
            'Create an original, copyright-safe scene. Do not include copyrighted characters, ' +
            'logos, brand names, or trademarks. Do not mention living artists. Avoid recognizable IP. ' +
            'Avoid text overlays unless explicitly requested. Return only valid JSON that matches the schema.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: promptLines.join('\n'),
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          finalPrompt: { type: 'string' },
          negativeConstraints: { type: 'array', items: { type: 'string' } },
          altText: { type: 'string' },
          seedHint: { type: 'string' },
        },
        required: ['finalPrompt', 'altText'],
      },
    },
  }

  try {
    const response = await client.generateContent(MODEL_ID, requestBody)
    const responseText = extractFirstText(response)
    if (!responseText) {
      return errorResponse(502, 'Prompt composer returned no content')
    }

    const parsed = safeJsonParse(responseText)
    if (!parsed || typeof parsed !== 'object') {
      return errorResponse(502, 'Prompt composer returned invalid JSON')
    }

    const finalPrompt = typeof parsed.finalPrompt === 'string' ? parsed.finalPrompt.trim() : ''
    const altText = typeof parsed.altText === 'string' ? parsed.altText.trim() : ''

    if (!finalPrompt || !altText) {
      return errorResponse(502, 'Prompt composer returned incomplete data')
    }

    const title =
      typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Untitled'
    const negativeConstraints = Array.isArray(parsed.negativeConstraints)
      ? parsed.negativeConstraints
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : []

    return jsonResponse({
      title,
      finalPrompt,
      negativeConstraints,
      altText,
      model: MODEL_ID,
    })
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return errorResponse(502, error.message)
    }

    const message = error instanceof Error ? error.message : 'Unexpected error'
    return errorResponse(500, message)
  }
}

function validatePayload(payload: PromptComposeRequest): { ok: true } | { ok: false; issues: string[] } {
  const issues: string[] = []

  if (!payload || typeof payload !== 'object') {
    return { ok: false, issues: ['Payload must be an object'] }
  }

  if (typeof payload.baseTemplateId !== 'string' || !payload.baseTemplateId.trim()) {
    issues.push('baseTemplateId is required')
  } else if (!getBaseTemplate(payload.baseTemplateId)) {
    issues.push('baseTemplateId is not recognized')
  }

  if (!Array.isArray(payload.styleTags)) {
    issues.push('styleTags must be an array of strings')
  } else {
    if (payload.styleTags.length === 0) {
      issues.push('styleTags must not be empty')
    }
    for (const tagId of payload.styleTags) {
      if (typeof tagId !== 'string' || !getStyleTag(tagId)) {
        issues.push(`styleTags contains invalid id: ${String(tagId)}`)
      }
    }
  }

  if (!ALLOWED_ASPECT_RATIOS.has(payload.aspectRatio)) {
    issues.push('aspectRatio is invalid')
  }

  if (payload.moodTags !== undefined) {
    if (!Array.isArray(payload.moodTags)) {
      issues.push('moodTags must be an array of strings')
    } else {
      for (const tagId of payload.moodTags) {
        if (typeof tagId !== 'string' || !getMoodTag(tagId)) {
          issues.push(`moodTags contains invalid id: ${String(tagId)}`)
        }
      }
    }
  }

  if (payload.paletteTags !== undefined) {
    if (!Array.isArray(payload.paletteTags)) {
      issues.push('paletteTags must be an array of strings')
    } else {
      for (const tagId of payload.paletteTags) {
        if (typeof tagId !== 'string' || !getPaletteTag(tagId)) {
          issues.push(`paletteTags contains invalid id: ${String(tagId)}`)
        }
      }
    }
  }

  if (payload.extraDetails !== undefined && typeof payload.extraDetails !== 'string') {
    issues.push('extraDetails must be a string')
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true }
}

function extractFirstText(response: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }): string | null {
  const candidates = response.candidates ?? []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if (typeof part.text === 'string' && part.text.trim()) {
        return part.text
      }
    }
  }
  return null
}

function safeJsonParse(input: string): any {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

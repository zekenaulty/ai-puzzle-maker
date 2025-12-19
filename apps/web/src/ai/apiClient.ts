export type PromptComposeRequest = {
  baseTemplateId: string
  styleTags: string[]
  moodTags?: string[]
  paletteTags?: string[]
  extraDetails?: string
  aspectRatio: string
}

export type PromptComposeResponse = {
  title: string
  finalPrompt: string
  negativeConstraints: string[]
  altText: string
  model: string
}

export type ImageGenerateRequest =
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

export type ImageGenerateResponse = {
  imageMimeType: string
  imageBase64: string
  width: number
  height: number
  promptUsed: string
  model: string
}

export type ModelsListResponse = {
  textModels: string[]
  imageModels: string[]
}

const API_BASE = '/api'

export async function composePrompt(payload: PromptComposeRequest): Promise<PromptComposeResponse> {
  return requestJson(`${API_BASE}/prompt/compose`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function generateImage(payload: ImageGenerateRequest): Promise<ImageGenerateResponse> {
  return requestJson(`${API_BASE}/image/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listModels(): Promise<ModelsListResponse> {
  return requestJson(`${API_BASE}/models`, { method: 'GET' })
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: string }).error)
        : `Request failed (${response.status})`
    throw new Error(errorMessage)
  }

  return payload as T
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

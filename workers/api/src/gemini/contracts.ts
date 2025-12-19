export type GeminiPart = {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

export type GeminiContent = {
  role?: 'user' | 'model' | 'system'
  parts: GeminiPart[]
}

export type GeminiGenerateContentRequest = {
  contents: GeminiContent[]
  system_instruction?: {
    parts: GeminiPart[]
  }
  generationConfig?: {
    responseMimeType?: string
    responseSchema?: Record<string, unknown>
    imageConfig?: {
      aspectRatio?: string
    }
  }
}

export type GeminiCandidate = {
  content?: GeminiContent
  finishReason?: string
  safetyRatings?: Array<Record<string, unknown>>
}

export type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[]
  promptFeedback?: Record<string, unknown>
}

export type GeminiErrorResponse = {
  error: {
    code: number
    message: string
    status?: string
  }
}

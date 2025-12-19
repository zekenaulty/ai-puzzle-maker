import { jsonResponse } from '../http'

const TEXT_MODELS = ['gemini-2.5-flash']
const IMAGE_MODELS = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview']

export function handleModelsList(): Response {
  return jsonResponse({
    textModels: TEXT_MODELS,
    imageModels: IMAGE_MODELS,
  })
}

import { errorResponse } from './http'
import { handleImageGenerate } from './routes/imageGenerate'
import { handleModelsList } from './routes/modelsList'
import { handlePromptCompose } from './routes/promptCompose'
import { handleHealth } from './routes/health'
import { Router } from './router'

export interface Env {
  AI_PUZZLE_MAKER__GEMINI_API_KEY?: string
  AI_PUZZLE_MAKER__GEMINI_BASE_URL?: string
}

const router = new Router()
router.add('GET', '/health', handleHealth)
router.add('POST', '/prompt/compose', handlePromptCompose)
router.add('POST', '/image/generate', handleImageGenerate)
router.add('GET', '/models', handleModelsList)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 })
      }

      const response = await router.handle(request, env, ctx)
      if (response) {
        return response
      }

      return errorResponse(404, 'Not found')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error'
      return errorResponse(500, message)
    }
  },
}

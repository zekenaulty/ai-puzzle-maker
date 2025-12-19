import { jsonResponse } from '../http'

export function handleHealth(): Response {
  return jsonResponse({
    ok: true,
    service: 'ai-puzzle-maker-api',
  })
}

import { vi } from 'vitest'

export function mockFetchJson(data: unknown, init: ResponseInit = {}) {
  const response = new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const fetchMock = vi.fn().mockResolvedValue(response)
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

export function mockFetchText(text: string, init: ResponseInit = {}) {
  const response = new Response(text, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
    ...init,
  })
  const fetchMock = vi.fn().mockResolvedValue(response)
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

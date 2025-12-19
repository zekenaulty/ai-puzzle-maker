type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export function jsonResponse(data: JsonValue, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8')
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  })
}

export function errorResponse(status: number, message: string, details?: JsonValue): Response {
  return jsonResponse(
    {
      error: message,
      details: details ?? null,
    },
    { status },
  )
}

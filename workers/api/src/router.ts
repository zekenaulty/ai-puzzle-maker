import type { Env } from './index'

export type Handler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) => Promise<Response> | Response

type Route = {
  method: string
  path: string
  handler: Handler
}

export class Router {
  private routes: Route[] = []

  add(method: string, path: string, handler: Handler) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler,
    })
    return this
  }

  async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
    const url = new URL(request.url)
    const path = normalizePath(url.pathname)
    const method = request.method.toUpperCase()
    const route = this.routes.find((candidate) => candidate.method === method && candidate.path === path)

    if (!route) {
      return null
    }

    return await route.handler(request, env, ctx)
  }
}

function normalizePath(pathname: string): string {
  if (pathname === '/api') {
    return '/'
  }

  if (pathname.startsWith('/api/')) {
    const trimmed = pathname.slice(4)
    return trimmed.length > 0 ? trimmed : '/'
  }

  return pathname
}

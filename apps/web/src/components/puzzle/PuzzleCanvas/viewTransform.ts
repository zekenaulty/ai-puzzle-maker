export type Vec2 = {
  x: number
  y: number
}

export type ViewTransform = {
  scale: number
  tx: number
  ty: number
}

export function applyViewTransform(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  pixelRatio = 1,
) {
  ctx.setTransform(
    view.scale * pixelRatio,
    0,
    0,
    view.scale * pixelRatio,
    view.tx * pixelRatio,
    view.ty * pixelRatio,
  )
}

export function worldToScreen(point: Vec2, view: ViewTransform): Vec2 {
  return {
    x: point.x * view.scale + view.tx,
    y: point.y * view.scale + view.ty,
  }
}

export function screenToWorld(point: Vec2, view: ViewTransform): Vec2 {
  return {
    x: (point.x - view.tx) / view.scale,
    y: (point.y - view.ty) / view.scale,
  }
}

export function identityView(): ViewTransform {
  return { scale: 1, tx: 0, ty: 0 }
}

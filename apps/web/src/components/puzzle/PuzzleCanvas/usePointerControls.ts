import { useEffect, useRef } from 'react'
import type { ViewTransform } from './viewTransform'
import { screenToWorld } from './viewTransform'

export type PointerControlsConfig = {
  view: ViewTransform
  onViewChange: (next: ViewTransform) => void
  onSelectPiece?: (worldPoint: Vec2) => string | null
  onDragStart?: (pieceId: string, worldPoint: Vec2) => void
  onDrag?: (pieceId: string, delta: Vec2, worldPoint: Vec2) => void
  onDragEnd?: (pieceId: string, worldPoint: Vec2) => void
  allowPanOnEmpty?: boolean
  minScale?: number
  maxScale?: number
  wheelZoomSpeed?: number
}

export type Vec2 = {
  x: number
  y: number
}

type PointerData = {
  id: number
  type: string
  screen: Vec2
  world: Vec2
}

type PinchState = {
  ids: [number, number]
  startDistance: number
  startScale: number
  startCenter: Vec2
  startView: ViewTransform
}

export function usePointerControls(
  targetRef: React.RefObject<HTMLElement>,
  config?: PointerControlsConfig,
) {
  const configRef = useRef<PointerControlsConfig | undefined>(config)
  const stateRef = useRef({
    pointers: new Map<number, PointerData>(),
    draggingPieceId: null as string | null,
    draggingPointerId: null as number | null,
    panningPointerId: null as number | null,
    pinch: null as PinchState | null,
  })

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    const target = targetRef.current
    if (!target || !config) {
      return undefined
    }

    const state = stateRef.current

    const onPointerDown = (event: PointerEvent) => {
      const activeConfig = configRef.current
      if (!activeConfig) {
        return
      }

      const screen = getLocalPoint(event, target)
      const world = screenToWorld(screen, activeConfig.view)
      const pointer: PointerData = {
        id: event.pointerId,
        type: event.pointerType,
        screen,
        world,
      }

      state.pointers.set(event.pointerId, pointer)
      target.setPointerCapture(event.pointerId)

      if (event.pointerType === 'touch') {
        if (state.pinch || state.draggingPieceId) {
          return
        }
        if (state.pointers.size === 2) {
          const [first, second] = getPointerPair(state.pointers)
          if (first && second) {
            state.pinch = createPinchState(first, second, activeConfig.view)
            event.preventDefault()
          }
        } else if (state.pointers.size === 1) {
          const pieceId = activeConfig.onSelectPiece?.(world) ?? null
          if (pieceId) {
            state.draggingPieceId = pieceId
            state.draggingPointerId = event.pointerId
            activeConfig.onDragStart?.(pieceId, world)
            event.preventDefault()
          }
        }
        return
      }

      const pieceId = activeConfig.onSelectPiece?.(world) ?? null
      if (pieceId) {
        state.draggingPieceId = pieceId
        state.draggingPointerId = event.pointerId
        activeConfig.onDragStart?.(pieceId, world)
        event.preventDefault()
        return
      }

      if (activeConfig.allowPanOnEmpty ?? true) {
        state.panningPointerId = event.pointerId
        event.preventDefault()
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const activeConfig = configRef.current
      if (!activeConfig) {
        return
      }

      const existing = state.pointers.get(event.pointerId)
      if (!existing) {
        return
      }

      const screen = getLocalPoint(event, target)
      const world = screenToWorld(screen, activeConfig.view)
      const nextPointer: PointerData = {
        ...existing,
        screen,
        world,
      }
      state.pointers.set(event.pointerId, nextPointer)

      if (state.pinch) {
        const first = state.pointers.get(state.pinch.ids[0])
        const second = state.pointers.get(state.pinch.ids[1])
        if (first && second) {
          const nextView = updatePinchView(state.pinch, first, second, activeConfig)
          activeConfig.onViewChange(nextView)
          event.preventDefault()
        }
        return
      }

      if (state.draggingPieceId && state.draggingPointerId === event.pointerId) {
        const delta = {
          x: world.x - existing.world.x,
          y: world.y - existing.world.y,
        }
        activeConfig.onDrag?.(state.draggingPieceId, delta, world)
        event.preventDefault()
        return
      }

      if (state.panningPointerId === event.pointerId && event.pointerType !== 'touch') {
        const delta = {
          x: screen.x - existing.screen.x,
          y: screen.y - existing.screen.y,
        }
        const nextView = {
          ...activeConfig.view,
          tx: activeConfig.view.tx + delta.x,
          ty: activeConfig.view.ty + delta.y,
        }
        activeConfig.onViewChange(nextView)
        event.preventDefault()
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      const activeConfig = configRef.current
      if (!activeConfig) {
        return
      }

      const pointer = state.pointers.get(event.pointerId)
      state.pointers.delete(event.pointerId)

      if (state.draggingPointerId === event.pointerId && state.draggingPieceId && pointer) {
        activeConfig.onDragEnd?.(state.draggingPieceId, pointer.world)
        state.draggingPieceId = null
        state.draggingPointerId = null
      }

      if (state.panningPointerId === event.pointerId) {
        state.panningPointerId = null
      }

      if (state.pinch && (!state.pointers.has(state.pinch.ids[0]) || !state.pointers.has(state.pinch.ids[1]))) {
        state.pinch = null
      }

      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId)
      }
    }

    const onWheel = (event: WheelEvent) => {
      const activeConfig = configRef.current
      if (!activeConfig) {
        return
      }

      if (!event.ctrlKey && !event.metaKey) {
        return
      }

      const speed = activeConfig.wheelZoomSpeed ?? 0.0015
      const delta = -event.deltaY * speed
      const zoom = Math.exp(delta)
      const screen = getLocalPoint(event, target)
      const nextView = zoomAt(activeConfig.view, screen, zoom, activeConfig)
      activeConfig.onViewChange(nextView)
      event.preventDefault()
    }

    target.addEventListener('pointerdown', onPointerDown)
    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointercancel', onPointerUp)
    target.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      target.removeEventListener('pointerdown', onPointerDown)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
      target.removeEventListener('pointercancel', onPointerUp)
      target.removeEventListener('wheel', onWheel)
    }
  }, [targetRef, Boolean(config)])
}

function getLocalPoint(event: { clientX: number; clientY: number }, target: HTMLElement): Vec2 {
  const rect = target.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function getPointerPair(map: Map<number, PointerData>): [PointerData | null, PointerData | null] {
  const iterator = map.values()
  const first = iterator.next().value ?? null
  const second = iterator.next().value ?? null
  return [first, second]
}

function createPinchState(first: PointerData, second: PointerData, view: ViewTransform): PinchState {
  const center = midpoint(first.screen, second.screen)
  return {
    ids: [first.id, second.id],
    startDistance: distance(first.screen, second.screen),
    startScale: view.scale,
    startCenter: center,
    startView: view,
  }
}

function updatePinchView(
  pinch: PinchState,
  first: PointerData,
  second: PointerData,
  config: PointerControlsConfig,
): ViewTransform {
  const currentDistance = distance(first.screen, second.screen)
  const scaleFactor = currentDistance / Math.max(1, pinch.startDistance)
  const newScale = clampScale(pinch.startScale * scaleFactor, config)
  const center = midpoint(first.screen, second.screen)
  return zoomAt(pinch.startView, center, newScale / pinch.startScale, config)
}

function zoomAt(
  view: ViewTransform,
  screen: Vec2,
  zoomFactor: number,
  config: PointerControlsConfig,
): ViewTransform {
  const clampedScale = clampScale(view.scale * zoomFactor, config)
  const world = screenToWorld(screen, view)
  return {
    scale: clampedScale,
    tx: screen.x - world.x * clampedScale,
    ty: screen.y - world.y * clampedScale,
  }
}

function clampScale(scale: number, config: PointerControlsConfig): number {
  const minScale = config.minScale ?? 0.25
  const maxScale = config.maxScale ?? 4
  return Math.min(maxScale, Math.max(minScale, scale))
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

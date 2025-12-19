import type { Seam, SeamOrientation, Vec2 } from '../model/puzzleTypes'
import type { SeededRng } from './seed'

export type EdgeFieldOptions = {
  rows: number
  cols: number
  rng: SeededRng
}

export function generateEdgeField({ rows, cols, rng }: EdgeFieldOptions): Seam[] {
  const seams: Seam[] = []
  let id = 0

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      seams.push(createVerticalSeam(id++, row, col, cols, rng))
    }
  }

  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      seams.push(createHorizontalSeam(id++, row, col, cols, rng))
    }
  }

  return seams
}

function createVerticalSeam(id: number, row: number, col: number, cols: number, rng: SeededRng): Seam {
  const aCell = row * cols + col
  const bCell = row * cols + (col + 1)
  const { p0, p1, p2, p3, jitter } = createBaseline('V', rng)

  return {
    id,
    aCell,
    bCell,
    orientation: 'V',
    p0,
    p1,
    p2,
    p3,
    tab: createTab(rng),
    jitter,
  }
}

function createHorizontalSeam(id: number, row: number, col: number, cols: number, rng: SeededRng): Seam {
  const aCell = row * cols + col
  const bCell = (row + 1) * cols + col
  const { p0, p1, p2, p3, jitter } = createBaseline('H', rng)

  return {
    id,
    aCell,
    bCell,
    orientation: 'H',
    p0,
    p1,
    p2,
    p3,
    tab: createTab(rng),
    jitter,
  }
}

function createBaseline(orientation: SeamOrientation, rng: SeededRng): {
  p0: Vec2
  p1: Vec2
  p2: Vec2
  p3: Vec2
  jitter: number
} {
  if (orientation === 'V') {
    const p0 = { x: 1, y: 0 }
    const p3 = { x: 1, y: 1 }
    const { p1, p2, jitter } = createControlPoints(p0, p3, rng, 'x')
    return { p0, p1, p2, p3, jitter }
  }

  const p0 = { x: 0, y: 1 }
  const p3 = { x: 1, y: 1 }
  const { p1, p2, jitter } = createControlPoints(p0, p3, rng, 'y')
  return { p0, p1, p2, p3, jitter }
}

function createControlPoints(
  p0: Vec2,
  p3: Vec2,
  rng: SeededRng,
  jitterAxis: 'x' | 'y',
): { p1: Vec2; p2: Vec2; jitter: number } {
  const t1 = clamp(0.33 + rng.nextRange(-0.06, 0.06), 0.2, 0.45)
  const t2 = clamp(0.66 + rng.nextRange(-0.06, 0.06), 0.55, 0.8)
  const base1 = lerpVec(p0, p3, t1)
  const base2 = lerpVec(p0, p3, t2)
  const jitter = rng.nextRange(0.02, 0.08)
  const offset1 = rng.nextRange(-jitter, jitter)
  const offset2 = rng.nextRange(-jitter, jitter)

  if (jitterAxis === 'x') {
    return {
      p1: { x: clamp(base1.x + offset1, 0.7, 1.3), y: base1.y },
      p2: { x: clamp(base2.x + offset2, 0.7, 1.3), y: base2.y },
      jitter,
    }
  }

  return {
    p1: { x: base1.x, y: clamp(base1.y + offset1, 0.7, 1.3) },
    p2: { x: base2.x, y: clamp(base2.y + offset2, 0.7, 1.3) },
    jitter,
  }
}

function createTab(rng: SeededRng) {
  const sign = rng.next() < 0.5 ? (1 as 1) : (-1 as -1)
  return {
    centerT: clamp(0.5 + rng.nextRange(-0.12, 0.12), 0.35, 0.65),
    amplitude: rng.nextRange(0.18, 0.28),
    width: rng.nextRange(0.22, 0.36),
    shape: 'bezier' as const,
    sign,
  }
}

function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

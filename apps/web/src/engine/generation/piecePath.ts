import type { CellTopology, PuzzleTopology, Seam, Vec2 } from '../model/puzzleTypes'

export type PiecePathOptions = {
  samplesPerEdge?: number
}

export type PiecePathResult = {
  path: Path2D
  points: Vec2[]
}

export function buildPiecePath(cell: CellTopology, topology: PuzzleTopology, options: PiecePathOptions = {}): PiecePathResult {
  const points = buildPiecePathPoints(cell, topology, options)
  const path = buildPathFromPoints(points)
  return { path, points }
}

export function buildPiecePathPoints(
  cell: CellTopology,
  topology: PuzzleTopology,
  options: PiecePathOptions = {},
): Vec2[] {
  const samplesPerEdge = options.samplesPerEdge ?? 28
  const seamById = new Map(topology.seams.map((seam) => [seam.id, seam]))

  const top = buildEdgePoints('top', cell, topology, seamById, samplesPerEdge)
  const right = buildEdgePoints('right', cell, topology, seamById, samplesPerEdge)
  const bottom = buildEdgePoints('bottom', cell, topology, seamById, samplesPerEdge)
  const left = buildEdgePoints('left', cell, topology, seamById, samplesPerEdge)

  return [top, right.slice(1), bottom.slice(1), left.slice(1)].flat()
}

function buildEdgePoints(
  edgeKey: 'top' | 'right' | 'bottom' | 'left',
  cell: CellTopology,
  topology: PuzzleTopology,
  seamById: Map<number, Seam>,
  samplesPerEdge: number,
): Vec2[] {
  const edge = cell.edges[edgeKey]
  const direction = edgeKey === 'bottom' || edgeKey === 'left' ? 'reverse' : 'forward'

  if (edge.isOuter) {
    return buildOuterEdge(edgeKey, direction)
  }

  if (edge.seamId === undefined) {
    return buildOuterEdge(edgeKey, direction)
  }

  const seam = seamById.get(edge.seamId)
  if (!seam) {
    return buildOuterEdge(edgeKey, direction)
  }

  const seamPoints = sampleSeamPoints(seam, edge.sign, topology.cols, samplesPerEdge)
  const cellOrigin = { x: cell.col, y: cell.row }
  const localPoints = seamPoints.map((point) => ({
    x: point.x - cellOrigin.x,
    y: point.y - cellOrigin.y,
  }))

  return direction === 'reverse' ? localPoints.reverse() : localPoints
}

function buildOuterEdge(edgeKey: 'top' | 'right' | 'bottom' | 'left', direction: 'forward' | 'reverse'): Vec2[] {
  let points: Vec2[]
  switch (edgeKey) {
    case 'top':
      points = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]
      break
    case 'right':
      points = [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ]
      break
    case 'bottom':
      points = [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]
      break
    case 'left':
      points = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ]
      break
  }

  return direction === 'reverse' ? points.reverse() : points
}

function sampleSeamPoints(seam: Seam, edgeSign: 1 | -1, cols: number, samples: number): Vec2[] {
  const origin = getCellOrigin(seam.aCell, cols)
  const points: Vec2[] = []
  const phase = (seam.id * 0.61803398875) % 1

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples
    const base = cubicBezierPoint(seam.p0, seam.p1, seam.p2, seam.p3, t)
    const tangent = cubicBezierTangent(seam.p0, seam.p1, seam.p2, seam.p3, t)
    const normalToB = getNormalToB(seam.orientation, tangent)
    const bump = knobProfile(t, seam.tab.centerT, seam.tab.width)
    const endFade = smoothstep(0, 0.12, t) * smoothstep(0, 0.12, 1 - t)
    const wave =
      Math.sin((t + phase) * Math.PI * 2) *
      seam.jitter *
      0.35 *
      endFade *
      (0.2 + 0.8 * bump)
    const amount = seam.tab.amplitude * bump + wave
    const offset = scaleVec(normalToB, -edgeSign * amount)
    points.push({
      x: origin.x + base.x + offset.x,
      y: origin.y + base.y + offset.y,
    })
  }

  if (points.length > 0) {
    points[0] = { x: origin.x + seam.p0.x, y: origin.y + seam.p0.y }
    points[points.length - 1] = { x: origin.x + seam.p3.x, y: origin.y + seam.p3.y }
  }
  return points
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function cubicBezierPoint(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  }
}

function cubicBezierTangent(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t
  return {
    x:
      3 * u * u * (p1.x - p0.x) +
      6 * u * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    y:
      3 * u * u * (p1.y - p0.y) +
      6 * u * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  }
}

function getNormalToB(orientation: 'H' | 'V', tangent: Vec2): Vec2 {
  let normal = { x: -tangent.y, y: tangent.x }
  const length = Math.hypot(normal.x, normal.y) || 1
  normal = { x: normal.x / length, y: normal.y / length }

  if (orientation === 'V') {
    return { x: -normal.x, y: -normal.y }
  }

  return normal
}

function knobProfile(t: number, centerT: number, width: number): number {
  const half = width * 0.5
  const distance = Math.abs(t - centerT)
  if (distance >= half || half === 0) {
    return 0
  }

  const normalized = distance / half
  return 0.5 * (1 + Math.cos(Math.PI * normalized))
}

function scaleVec(vec: Vec2, scale: number): Vec2 {
  return { x: vec.x * scale, y: vec.y * scale }
}

function getCellOrigin(index: number, cols: number): Vec2 {
  return {
    x: index % cols,
    y: Math.floor(index / cols),
  }
}

function buildPathFromPoints(points: Vec2[]): Path2D {
  const path = new Path2D()
  if (points.length === 0) {
    return path
  }

  path.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i += 1) {
    path.lineTo(points[i].x, points[i].y)
  }
  path.closePath()
  return path
}

export type SeedState = {
  state: number
}

export type SeededRng = {
  next: () => number
  nextInt: (maxExclusive: number) => number
  nextRange: (min: number, max: number) => number
}

const UINT32_MAX = 0xffffffff

export function createSeededRng(seed: number): SeededRng {
  let state = normalizeSeed(seed)

  const next = () => {
    state = mulberry32(state)
    return state / UINT32_MAX
  }

  const nextInt = (maxExclusive: number) => {
    return Math.floor(next() * maxExclusive)
  }

  const nextRange = (min: number, max: number) => {
    return min + next() * (max - min)
  }

  return { next, nextInt, nextRange }
}

export function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0
  return normalized === 0 ? 0x6d2b79f5 : normalized
}

function mulberry32(input: number): number {
  let t = (input + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return (t ^ (t >>> 14)) >>> 0
}

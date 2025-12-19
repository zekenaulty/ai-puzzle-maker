export type Aabb = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export class SpatialIndex {
  private cellSize: number
  private cells = new Map<string, Set<string>>()
  private itemCells = new Map<string, string[]>()
  private itemBounds = new Map<string, Aabb>()

  constructor(cellSize: number) {
    if (cellSize <= 0) {
      throw new Error('SpatialIndex cellSize must be positive')
    }
    this.cellSize = cellSize
  }

  insert(id: string, bounds: Aabb) {
    this.remove(id)
    const keys = this.getCellKeys(bounds)
    for (const key of keys) {
      const bucket = this.cells.get(key) ?? new Set<string>()
      bucket.add(id)
      this.cells.set(key, bucket)
    }
    this.itemCells.set(id, keys)
    this.itemBounds.set(id, bounds)
  }

  update(id: string, bounds: Aabb) {
    this.insert(id, bounds)
  }

  remove(id: string) {
    const keys = this.itemCells.get(id)
    if (keys) {
      for (const key of keys) {
        const bucket = this.cells.get(key)
        if (!bucket) {
          continue
        }
        bucket.delete(id)
        if (bucket.size === 0) {
          this.cells.delete(key)
        }
      }
    }
    this.itemCells.delete(id)
    this.itemBounds.delete(id)
  }

  query(bounds: Aabb): Set<string> {
    const keys = this.getCellKeys(bounds)
    const results = new Set<string>()
    for (const key of keys) {
      const bucket = this.cells.get(key)
      if (!bucket) {
        continue
      }
      for (const id of bucket) {
        const itemBounds = this.itemBounds.get(id)
        if (!itemBounds) {
          continue
        }
        if (intersects(bounds, itemBounds)) {
          results.add(id)
        }
      }
    }
    return results
  }

  getBounds(id: string): Aabb | undefined {
    return this.itemBounds.get(id)
  }

  clear() {
    this.cells.clear()
    this.itemCells.clear()
    this.itemBounds.clear()
  }

  private getCellKeys(bounds: Aabb): string[] {
    const minCellX = Math.floor(bounds.minX / this.cellSize)
    const maxCellX = Math.floor(bounds.maxX / this.cellSize)
    const minCellY = Math.floor(bounds.minY / this.cellSize)
    const maxCellY = Math.floor(bounds.maxY / this.cellSize)
    const keys: string[] = []

    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let y = minCellY; y <= maxCellY; y += 1) {
        keys.push(`${x}:${y}`)
      }
    }

    return keys
  }
}

export function intersects(a: Aabb, b: Aabb): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
}

export function expandAabb(bounds: Aabb, amount: number): Aabb {
  return {
    minX: bounds.minX - amount,
    minY: bounds.minY - amount,
    maxX: bounds.maxX + amount,
    maxY: bounds.maxY + amount,
  }
}

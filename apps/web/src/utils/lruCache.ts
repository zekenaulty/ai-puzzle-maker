type LruOptions<V> = {
  onEvict?: (value: V) => void
}

export class LruCache<K, V> {
  private capacity: number
  private map = new Map<K, V>()
  private onEvict?: (value: V) => void

  constructor(capacity: number, options: LruOptions<V> = {}) {
    if (capacity < 1) {
      throw new Error('LruCache capacity must be at least 1')
    }
    this.capacity = capacity
    this.onEvict = options.onEvict
  }

  get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value === undefined) {
      return undefined
    }
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    }
    this.map.set(key, value)
    this.trim()
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  delete(key: K): boolean {
    const value = this.map.get(key)
    if (value !== undefined) {
      this.map.delete(key)
      this.onEvict?.(value)
      return true
    }
    return false
  }

  clear(): void {
    if (this.onEvict) {
      for (const value of this.map.values()) {
        this.onEvict(value)
      }
    }
    this.map.clear()
  }

  size(): number {
    return this.map.size
  }

  private trim() {
    while (this.map.size > this.capacity) {
      const firstKey = this.map.keys().next().value as K | undefined
      if (firstKey === undefined) {
        return
      }
      const value = this.map.get(firstKey)
      this.map.delete(firstKey)
      if (value !== undefined) {
        this.onEvict?.(value)
      }
    }
  }
}

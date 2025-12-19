export class UnionFind {
  private parent: number[]
  private size: number[]

  constructor(count: number) {
    if (count < 1) {
      throw new Error('UnionFind requires at least one element')
    }
    this.parent = Array.from({ length: count }, (_, index) => index)
    this.size = Array.from({ length: count }, () => 1)
  }

  static fromParents(parents: number[]): UnionFind {
    const uf = new UnionFind(parents.length)
    uf.parent = parents.map((value, index) => (value >= 0 && value < parents.length ? value : index))
    uf.size = Array.from({ length: parents.length }, () => 1)
    for (let i = 0; i < uf.parent.length; i += 1) {
      const root = uf.find(i)
      uf.size[root] += i === root ? 0 : 1
    }
    return uf
  }

  find(index: number): number {
    let root = index
    while (this.parent[root] !== root) {
      root = this.parent[root]
    }

    let current = index
    while (this.parent[current] !== current) {
      const next = this.parent[current]
      this.parent[current] = root
      current = next
    }

    return root
  }

  union(a: number, b: number): number {
    const rootA = this.find(a)
    const rootB = this.find(b)

    if (rootA === rootB) {
      return rootA
    }

    if (this.size[rootA] < this.size[rootB]) {
      this.parent[rootA] = rootB
      this.size[rootB] += this.size[rootA]
      return rootB
    }

    this.parent[rootB] = rootA
    this.size[rootA] += this.size[rootB]
    return rootA
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b)
  }

  getSize(index: number): number {
    return this.size[this.find(index)]
  }

  snapshot(): number[] {
    return this.parent.slice()
  }
}

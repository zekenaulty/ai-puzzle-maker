import { getDb } from './db'
import type { PuzzleRecord } from './types'

export async function savePuzzle(record: PuzzleRecord): Promise<void> {
  const db = await getDb()
  await db.put('puzzles', record)
}

export async function getPuzzle(puzzleId: string): Promise<PuzzleRecord | undefined> {
  const db = await getDb()
  return db.get('puzzles', puzzleId)
}

export async function listPuzzles(): Promise<PuzzleRecord[]> {
  const db = await getDb()
  const items = await db.getAllFromIndex('puzzles', 'by-createdAt')
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export async function listPuzzlesByImage(imageId: string): Promise<PuzzleRecord[]> {
  const db = await getDb()
  const items = await db.getAllFromIndex('puzzles', 'by-imageId', imageId)
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deletePuzzle(puzzleId: string): Promise<void> {
  const db = await getDb()
  await db.delete('puzzles', puzzleId)
}

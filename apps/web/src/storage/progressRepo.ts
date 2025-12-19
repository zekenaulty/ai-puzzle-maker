import { getDb } from './db'
import type { ProgressRecord } from './types'

export async function saveProgress(record: ProgressRecord): Promise<void> {
  const db = await getDb()
  await db.put('progress', record)
}

export async function getProgress(puzzleId: string): Promise<ProgressRecord | undefined> {
  const db = await getDb()
  return db.get('progress', puzzleId)
}

export async function deleteProgress(puzzleId: string): Promise<void> {
  const db = await getDb()
  await db.delete('progress', puzzleId)
}

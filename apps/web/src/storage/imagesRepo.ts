import { getDb } from './db'
import type { ImageRecord } from './types'

export async function saveImage(record: ImageRecord): Promise<void> {
  const db = await getDb()
  await db.put('images', record)
}

export async function getImage(imageId: string): Promise<ImageRecord | undefined> {
  const db = await getDb()
  return db.get('images', imageId)
}

export async function listImages(): Promise<ImageRecord[]> {
  const db = await getDb()
  const items = await db.getAllFromIndex('images', 'by-createdAt')
  return items.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteImage(imageId: string): Promise<void> {
  const db = await getDb()
  await db.delete('images', imageId)
}

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ImageRecord, ProgressRecord, PuzzleRecord, SettingsRecord } from './types'

interface AiPuzzleDb extends DBSchema {
  images: {
    key: string
    value: ImageRecord
    indexes: {
      'by-createdAt': number
    }
  }
  puzzles: {
    key: string
    value: PuzzleRecord
    indexes: {
      'by-createdAt': number
      'by-imageId': string
    }
  }
  progress: {
    key: string
    value: ProgressRecord
  }
  settings: {
    key: string
    value: SettingsRecord
  }
}

const DB_NAME = 'ai-puzzle-maker-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<AiPuzzleDb>> | null = null
let currentDb: IDBPDatabase<AiPuzzleDb> | null = null

export function getDb(): Promise<IDBPDatabase<AiPuzzleDb>> {
  if (!dbPromise) {
    dbPromise = openDB<AiPuzzleDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const imagesStore = db.createObjectStore('images', { keyPath: 'imageId' })
        imagesStore.createIndex('by-createdAt', 'createdAt')

        const puzzlesStore = db.createObjectStore('puzzles', { keyPath: 'puzzleId' })
        puzzlesStore.createIndex('by-createdAt', 'createdAt')
        puzzlesStore.createIndex('by-imageId', 'imageId')

        db.createObjectStore('progress', { keyPath: 'puzzleId' })
        db.createObjectStore('settings', { keyPath: 'key' })
      },
    }).then((db) => {
      currentDb = db
      return db
    })
  }

  return dbPromise
}

export async function resetDb(): Promise<void> {
  if (currentDb) {
    currentDb.close()
    currentDb = null
  }
  dbPromise = null
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error ?? new Error('Failed to delete database'))
    request.onblocked = () => resolve()
  })
}

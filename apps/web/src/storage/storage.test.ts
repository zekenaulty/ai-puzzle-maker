import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { resetDb } from './db'
import { saveImage, getImage, listImages, deleteImage } from './imagesRepo'
import { savePuzzle, getPuzzle, listPuzzles, listPuzzlesByImage, deletePuzzle } from './puzzlesRepo'
import { saveProgress, getProgress, deleteProgress } from './progressRepo'
import { getSettings, saveSettings, updateSettings, getDefaultSettings } from './settingsRepo'
import type { ImageRecord, PuzzleRecord, ProgressRecord } from './types'
import { CURRENT_GENERATOR_VERSION } from '../engine/model/idSchemas'

const now = Date.now()

function makeImage(id: string): ImageRecord {
  return {
    imageId: id,
    createdAt: now,
    source: 'generated',
    mime: 'image/png',
    blob: new Blob(['test'], { type: 'image/png' }),
    width: 100,
    height: 100,
  }
}

function makePuzzle(id: string, imageId: string): PuzzleRecord {
  return {
    puzzleId: id,
    imageId,
    seed: 123,
    pieceCount: 100,
    generatorVersion: CURRENT_GENERATOR_VERSION,
    board: { width: 100, height: 100, padding: 8 },
    edges: { rows: 10, cols: 10, seams: [] },
    createdAt: now,
  }
}

function makeProgress(puzzleId: string): ProgressRecord {
  return {
    puzzleId,
    pieces: [],
    clusters: [],
    view: { scale: 1, tx: 0, ty: 0 },
    lastSavedAt: now,
  }
}

describe('storage repositories', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('saves and retrieves images and lists them sorted', async () => {
    const imgA = makeImage('img-a')
    const imgB = { ...makeImage('img-b'), createdAt: now + 100 }

    await saveImage(imgA)
    await saveImage(imgB)

    const fetched = await getImage('img-b')
    const all = await listImages()

    expect(fetched?.imageId).toBe('img-b')
    expect(all.map((i) => i.imageId)).toEqual(['img-b', 'img-a'])

    await deleteImage('img-a')
    const afterDelete = await getImage('img-a')
    expect(afterDelete).toBeUndefined()
  })

  it('saves and retrieves puzzles, lists, and filters by image', async () => {
    const puzzleA = makePuzzle('puz-a', 'img-a')
    const puzzleB = { ...makePuzzle('puz-b', 'img-b'), createdAt: now + 50 }
    await savePuzzle(puzzleA)
    await savePuzzle(puzzleB)

    const fetched = await getPuzzle('puz-b')
    expect(fetched?.puzzleId).toBe('puz-b')

    const all = await listPuzzles()
    expect(all.map((p) => p.puzzleId)).toEqual(['puz-b', 'puz-a'])

    const byImage = await listPuzzlesByImage('img-a')
    expect(byImage).toHaveLength(1)
    expect(byImage[0]?.puzzleId).toBe('puz-a')

    await deletePuzzle('puz-a')
    const afterDelete = await getPuzzle('puz-a')
    expect(afterDelete).toBeUndefined()
  })

  it('saves and retrieves progress records', async () => {
    const progress = makeProgress('puz-a')
    await saveProgress(progress)
    const fetched = await getProgress('puz-a')
    expect(fetched?.puzzleId).toBe('puz-a')
    await deleteProgress('puz-a')
    const afterDelete = await getProgress('puz-a')
    expect(afterDelete).toBeUndefined()
  })

  it('loads default settings when none exist', async () => {
    const settings = await getSettings()
    expect(settings).toMatchObject(getDefaultSettings())
  })

  it('merges saved settings with defaults', async () => {
    const base = getDefaultSettings()
    await saveSettings({ ...base, rotationEnabled: false, snappingTolerance: 0.1 })
    const settings = await getSettings()
    expect(settings.rotationEnabled).toBe(false)
    expect(settings.snappingTolerance).toBeCloseTo(0.1)
    expect(settings.accessibility.highContrast).toBe(false)
  })

  it('updates settings partially', async () => {
    const next = await updateSettings({ accessibility: { highContrast: true, reducedMotion: false } })
    expect(next.accessibility.highContrast).toBe(true)
    const loaded = await getSettings()
    expect(loaded.accessibility.highContrast).toBe(true)
  })
})

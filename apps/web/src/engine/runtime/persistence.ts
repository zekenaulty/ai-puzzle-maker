import type { ProgressRecord, PuzzleProgressView } from '../../storage/types'

export type PersistedPieceState = {
  cellIndex: number
  x: number
  y: number
  rotation: number
  zIndex: number
  clusterId?: number
}

export type ProgressSnapshot = {
  pieces: PersistedPieceState[]
  clusters: number[]
  view: PuzzleProgressView
  completedAt?: number
}

type ProgressSnapshotProvider = () => ProgressSnapshot | null

export type ProgressPersistenceHandle = {
  notifyChange: () => void
  flush: () => Promise<void>
  dispose: () => void
}

type ProgressPersistenceOptions = {
  puzzleId: string
  getSnapshot: ProgressSnapshotProvider
  saveProgress: (record: ProgressRecord) => Promise<void>
  debounceMs?: number
  checkpointMs?: number
  onError?: (error: Error) => void
}

export function createProgressPersistence(options: ProgressPersistenceOptions): ProgressPersistenceHandle {
  const debounceMs = options.debounceMs ?? 750
  const checkpointMs = options.checkpointMs ?? 10000

  let changeToken = 0
  let lastSavedToken = 0
  let isSaving = false
  let pendingSave = false
  let debounceTimer: number | null = null
  let checkpointTimer: number | null = null

  const scheduleDebounce = () => {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => {
      void persist()
    }, debounceMs)
  }

  const notifyChange = () => {
    changeToken += 1
    scheduleDebounce()
  }

  const persist = async () => {
    if (isSaving) {
      pendingSave = true
      return
    }
    if (changeToken === lastSavedToken) {
      return
    }

    const snapshot = options.getSnapshot()
    if (!snapshot) {
      return
    }

    const tokenAtStart = changeToken
    isSaving = true

    try {
      const record: ProgressRecord = {
        puzzleId: options.puzzleId,
        pieces: snapshot.pieces,
        clusters: snapshot.clusters,
        view: snapshot.view,
        lastSavedAt: Date.now(),
        completedAt: snapshot.completedAt,
      }
      await options.saveProgress(record)
      lastSavedToken = tokenAtStart
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save progress')
      options.onError?.(error)
    } finally {
      isSaving = false
      if (pendingSave) {
        pendingSave = false
        if (changeToken !== lastSavedToken) {
          scheduleDebounce()
        }
      }
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      void persist()
    }
  }

  const handlePageHide = () => {
    void persist()
  }

  checkpointTimer = window.setInterval(() => {
    if (changeToken !== lastSavedToken) {
      void persist()
    }
  }, checkpointMs)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)

  const dispose = () => {
    if (debounceTimer !== null) {
      window.clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (checkpointTimer !== null) {
      window.clearInterval(checkpointTimer)
      checkpointTimer = null
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
  }

  return { notifyChange, flush: persist, dispose }
}

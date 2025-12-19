import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProgressPersistence, type ProgressSnapshot } from './persistence'

const snapshot: ProgressSnapshot = {
  pieces: [{ cellIndex: 0, x: 10, y: 20, rotation: 0, zIndex: 1 }],
  clusters: [0],
  view: { scale: 1, tx: 0, ty: 0 },
}

const flushMicrotasks = () => new Promise<void>((resolve) => queueMicrotask(resolve))

describe('progress persistence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces saves after changes', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockResolvedValue(undefined)
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-1',
      getSnapshot: () => snapshot,
      saveProgress,
      debounceMs: 100,
      checkpointMs: 1000,
    })

    handle.notifyChange()
    expect(saveProgress).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    await flushMicrotasks()

    expect(saveProgress).toHaveBeenCalledTimes(1)
    handle.dispose()
  })

  it('runs periodic checkpoints when unsaved changes exist', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockResolvedValue(undefined)
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-2',
      getSnapshot: () => snapshot,
      saveProgress,
      debounceMs: 1000,
      checkpointMs: 50,
    })

    handle.notifyChange()
    vi.advanceTimersByTime(50)
    await flushMicrotasks()

    expect(saveProgress).toHaveBeenCalledTimes(1)
    handle.dispose()
  })

  it('saves on visibility change to hidden', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockResolvedValue(undefined)
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-3',
      getSnapshot: () => snapshot,
      saveProgress,
      debounceMs: 1000,
      checkpointMs: 1000,
    })

    handle.notifyChange()
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushMicrotasks()

    expect(saveProgress).toHaveBeenCalledTimes(1)
    handle.dispose()
  })

  it('saves on pagehide', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockResolvedValue(undefined)
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-4',
      getSnapshot: () => snapshot,
      saveProgress,
      debounceMs: 1000,
      checkpointMs: 1000,
    })

    handle.notifyChange()
    window.dispatchEvent(new Event('pagehide'))
    await flushMicrotasks()

    expect(saveProgress).toHaveBeenCalledTimes(1)
    handle.dispose()
  })

  it('skips saving when no snapshot is available', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockResolvedValue(undefined)
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-5',
      getSnapshot: () => null,
      saveProgress,
      debounceMs: 50,
      checkpointMs: 1000,
    })

    handle.notifyChange()
    vi.advanceTimersByTime(60)
    await flushMicrotasks()

    expect(saveProgress).not.toHaveBeenCalled()
    handle.dispose()
  })

  it('notifies on save errors', async () => {
    vi.useFakeTimers()
    const saveProgress = vi.fn().mockRejectedValue(new Error('nope'))
    const onError = vi.fn()
    const handle = createProgressPersistence({
      puzzleId: 'puzzle-6',
      getSnapshot: () => snapshot,
      saveProgress,
      debounceMs: 10,
      checkpointMs: 1000,
      onError,
    })

    handle.notifyChange()
    vi.advanceTimersByTime(10)
    await flushMicrotasks()

    expect(onError).toHaveBeenCalledTimes(1)
    handle.dispose()
  })
})

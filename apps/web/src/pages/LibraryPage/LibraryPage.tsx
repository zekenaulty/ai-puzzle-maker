import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import LibraryImageCard from '../../components/library/LibraryImageCard'
import LibraryPuzzleCard from '../../components/library/LibraryPuzzleCard'
import { deleteProgress, getProgress } from '../../storage/progressRepo'
import { deleteImage, listImages } from '../../storage/imagesRepo'
import { deletePuzzle, listPuzzles, savePuzzle } from '../../storage/puzzlesRepo'
import { getSettings } from '../../storage/settingsRepo'
import type { ImageRecord, ProgressRecord, PuzzleRecord, AspectRatio } from '../../storage/types'
import { buildPuzzleTopology } from '../../engine/generation/pieceTopology'
import { createSeededRng } from '../../engine/generation/seed'
import { CURRENT_GENERATOR_VERSION } from '../../engine/model/idSchemas'
import { aspectRatioOptions } from '../../components/create/createOptions'

type ProgressMap = Record<string, ProgressRecord>

export default function LibraryPage() {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [puzzles, setPuzzles] = useState<PuzzleRecord[]>([])
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [busyPuzzleId, setBusyPuzzleId] = useState<string | null>(null)
  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [imageUsage, setImageUsage] = useState<Record<string, number>>({})

  useEffect(() => {
    let isActive = true

    const loadLibrary = async () => {
      setLoading(true)
      setError(null)
      try {
        const [imageList, puzzleList] = await Promise.all([listImages(), listPuzzles()])
        if (!isActive) {
          return
        }
        setImages(imageList)
        setPuzzles(puzzleList)

        const progressEntries = await Promise.all(
          puzzleList.map(async (puzzle) => [puzzle.puzzleId, await getProgress(puzzle.puzzleId)] as const),
        )
        if (!isActive) {
          return
        }
        const nextMap: ProgressMap = {}
        for (const [puzzleId, progress] of progressEntries) {
          if (progress) {
            nextMap[puzzleId] = progress
          }
        }
        setProgressMap(nextMap)
        const usage: Record<string, number> = {}
        for (const puzzle of puzzleList) {
          usage[puzzle.imageId] = (usage[puzzle.imageId] ?? 0) + 1
        }
        setImageUsage(usage)
      } catch (err) {
        if (isActive) {
          const message = err instanceof Error ? err.message : 'Failed to load library'
          setError(message)
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadLibrary()

    return () => {
      isActive = false
    }
  }, [refreshKey])

  useEffect(() => {
    const urls: Record<string, string> = {}
    for (const image of images) {
      const blob = image.previewBlob ?? image.blob
      if (!blob) {
        continue
      }
      urls[image.imageId] = URL.createObjectURL(blob)
    }
    setImageUrls(urls)

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [images])

  const resumePuzzle = useMemo(() => {
    if (puzzles.length === 0) {
      return null
    }
    return [...puzzles].sort((a, b) => {
      const aProgress = progressMap[a.puzzleId]
      const bProgress = progressMap[b.puzzleId]
      const aTime = aProgress?.lastSavedAt ?? a.createdAt
      const bTime = bProgress?.lastSavedAt ?? b.createdAt
      return bTime - aTime
    })[0]
  }, [puzzles, progressMap])

  const handleResetProgress = async (puzzleId: string) => {
    setBusyPuzzleId(puzzleId)
    try {
      await deleteProgress(puzzleId)
      setProgressMap((prev) => {
        const next = { ...prev }
        delete next[puzzleId]
        return next
      })
    } finally {
      setBusyPuzzleId(null)
    }
  }

  const handleDeletePuzzle = async (puzzleId: string) => {
    setBusyPuzzleId(puzzleId)
    try {
      await deleteProgress(puzzleId)
      await deletePuzzle(puzzleId)
      setPuzzles((prev) => prev.filter((p) => p.puzzleId !== puzzleId))
      setProgressMap((prev) => {
        const next = { ...prev }
        delete next[puzzleId]
        return next
      })
      setImageUsage((prev) => {
        const next = { ...prev }
        const puzzle = puzzles.find((p) => p.puzzleId === puzzleId)
        if (puzzle) {
          next[puzzle.imageId] = Math.max(0, (next[puzzle.imageId] ?? 1) - 1)
        }
        return next
      })
    } finally {
      setBusyPuzzleId(null)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setBusyImageId(imageId)
    try {
      await deleteImage(imageId)
      setImages((prev) => prev.filter((img) => img.imageId !== imageId))
      setImageUsage((prev) => {
        const next = { ...prev }
        delete next[imageId]
        return next
      })
      setImageUrls((prev) => {
        const next = { ...prev }
        if (next[imageId]) {
          URL.revokeObjectURL(next[imageId])
          delete next[imageId]
        }
        return next
      })
    } finally {
      setBusyImageId(null)
    }
  }

  const handleCreatePuzzleFromImage = async (image: ImageRecord) => {
    setBusyImageId(image.imageId)
    try {
      const settings = await getSettings()
      const pieceCount = settings.defaultPieceCount
      const aspectRatio = chooseNearestAspectRatio(image.width, image.height, settings.preferredAspectRatio)

      const seed = Math.floor(Math.random() * 0xffffffff)
      const rng = createSeededRng(seed)
      const topology = buildPuzzleTopology(pieceCount, aspectRatio, rng)
      const padding = Math.round(Math.max(image.width, image.height) * 0.08)
      const puzzleId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `puz_${Date.now()}_${Math.random().toString(16).slice(2)}`

      const record: PuzzleRecord = {
        puzzleId,
        imageId: image.imageId,
        seed,
        pieceCount,
        generatorVersion: CURRENT_GENERATOR_VERSION,
        board: {
          width: image.width,
          height: image.height,
          padding,
        },
        edges: {
          rows: topology.rows,
          cols: topology.cols,
          seams: topology.seams,
        },
        createdAt: Date.now(),
        aspectRatio,
      }
      await savePuzzle(record)
      setPuzzles((prev) => [record, ...prev])
      setImageUsage((prev) => ({
        ...prev,
        [image.imageId]: (prev[image.imageId] ?? 0) + 1,
      }))
    } finally {
      setBusyImageId(null)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h3">Library</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Review your generated images and puzzle progress.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setRefreshKey((key) => key + 1)}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Paper sx={{ p: 4 }}>
          <Stack spacing={1} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading your library...
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {error ? (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      ) : null}

      {!loading && !error ? (
        <Stack spacing={3}>
          {resumePuzzle ? (
            <Paper sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">Resume last puzzle</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Continue where you left off. Your progress is saved automatically.
                </Typography>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to={`/play/${resumePuzzle.puzzleId}`}
                  sx={{ mt: 2 }}
                >
                  Resume puzzle
                </Button>
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <LibraryPuzzleCard
                  puzzle={resumePuzzle}
                  progress={progressMap[resumePuzzle.puzzleId]}
                  previewUrl={imageUrls[resumePuzzle.imageId]}
                />
              </Box>
            </Paper>
          ) : null}

          <Section
            title="Your puzzles"
            subtitle="Jump back into any puzzle or track progress."
            emptyMessage="No puzzles yet. Create an image and generate a puzzle to get started."
            items={puzzles.map((puzzle) => (
              <LibraryPuzzleCard
                key={puzzle.puzzleId}
                puzzle={puzzle}
                progress={progressMap[puzzle.puzzleId]}
                previewUrl={imageUrls[puzzle.imageId]}
                onReset={() => handleResetProgress(puzzle.puzzleId)}
                onDelete={() => handleDeletePuzzle(puzzle.puzzleId)}
                loading={busyPuzzleId === puzzle.puzzleId}
              />
            ))}
          />

          <Section
            title="Your images"
            subtitle="Every generated or uploaded image stays here."
            emptyMessage="No images yet. Generate a puzzle image to see it here."
            items={images.map((image) => (
              <LibraryImageCard
                key={image.imageId}
                image={image}
                previewUrl={imageUrls[image.imageId]}
                puzzleCount={imageUsage[image.imageId] ?? 0}
                onDelete={imageUsage[image.imageId] ? undefined : () => handleDeleteImage(image.imageId)}
                onCreatePuzzle={() => handleCreatePuzzleFromImage(image)}
                busy={busyImageId === image.imageId}
              />
            ))}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}

function chooseNearestAspectRatio(width: number, height: number, fallback: AspectRatio): AspectRatio {
  const ratio = width / height
  const candidates = aspectRatioOptions.map((opt): { value: AspectRatio; delta: number } => {
    const [w, h] = opt.value.split(':').map(Number)
    const value = w && h ? w / h : 1
    return { value: opt.value as AspectRatio, delta: Math.abs(value - ratio) }
  })
  candidates.sort((a, b) => a.delta - b.delta)
  return candidates[0]?.value ?? fallback
}

type SectionProps = {
  title: string
  subtitle: string
  emptyMessage: string
  items: React.ReactNode[]
}

function Section({ title, subtitle, emptyMessage, items }: SectionProps) {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {items}
        </Box>
      )}
    </Stack>
  )
}

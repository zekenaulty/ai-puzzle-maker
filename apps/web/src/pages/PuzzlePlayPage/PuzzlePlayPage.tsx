import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import PuzzleCanvas from '../../components/puzzle/PuzzleCanvas/PuzzleCanvas'
import type { PuzzleScene } from '../../components/puzzle/PuzzleCanvas/usePuzzleRenderer'
import type { ViewTransform } from '../../components/puzzle/PuzzleCanvas/viewTransform'
import PieceControls from '../../components/puzzle/PieceControls/PieceControls'
import ZoomPanControls from '../../components/puzzle/PieceControls/ZoomPanControls'
import ProgressHUD from '../../components/puzzle/ProgressHUD/ProgressHUD'
import { buildTopologyFromSeams } from '../../engine/generation/pieceTopology'
import { rasterizePieces } from '../../engine/generation/rasterizePieces'
import { createSeededRng } from '../../engine/generation/seed'
import type { PuzzleTopology, Vec2 } from '../../engine/model/puzzleTypes'
import { createProgressPersistence, type PersistedPieceState } from '../../engine/runtime/persistence'
import { hitTestPieces } from '../../engine/runtime/selection'
import { buildNeighborGraph, findSnapCandidate, getPieceAabb } from '../../engine/runtime/snapping'
import type { NeighborGraph, PieceState } from '../../engine/runtime/snapping'
import { SpatialIndex } from '../../engine/runtime/spatialIndex'
import { UnionFind } from '../../engine/runtime/unionFind'
import { getImage } from '../../storage/imagesRepo'
import { getProgress, saveProgress } from '../../storage/progressRepo'
import { getPuzzle } from '../../storage/puzzlesRepo'
import { getSettings } from '../../storage/settingsRepo'
import type { PuzzleEdges } from '../../storage/types'
import { decodeImage } from '../../utils/imageUtils'

type PieceRuntime = {
  id: string
  cellIndex: number
  x: number
  y: number
  rotation: number
  width: number
  height: number
  bitmap: ImageBitmap
  anchorOffset: Vec2
  clusterId: number
  zIndex: number
  isDragging?: boolean
}

type BoardState = {
  width: number
  height: number
  padding: number
}

type BackgroundState = {
  image: CanvasImageSource
  width: number
  height: number
}

const DEFAULT_ROTATION_STEP_DEGREES = 90
const DEFAULT_BACKGROUND_OPACITY = 0.35
const TRANSLATION_TOLERANCE_RATIO = 0.08

export default function PuzzlePlayPage() {
  const { puzzleId } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const containerRef = useRef<HTMLDivElement | null>(null)
  const piecesRef = useRef<PieceRuntime[]>([])
  const unionFindRef = useRef<UnionFind | null>(null)
  const spatialIndexRef = useRef<SpatialIndex | null>(null)
  const topologyRef = useRef<PuzzleTopology | null>(null)
  const metricsRef = useRef<{ cellWidth: number; cellHeight: number } | null>(null)
  const neighborGraphRef = useRef<NeighborGraph | null>(null)
  const draggingClusterRef = useRef<number | null>(null)
  const viewInitializedRef = useRef(false)
  const backgroundReleaseRef = useRef<(() => void) | null>(null)
  const zCounterRef = useRef(0)
  const persistenceRef = useRef<ReturnType<typeof createProgressPersistence> | null>(null)
  const completedAtRef = useRef<number | undefined>(undefined)

  const [pieces, setPieces] = useState<PieceRuntime[]>([])
  const [board, setBoard] = useState<BoardState | null>(null)
  const [background, setBackground] = useState<BackgroundState | null>(null)
  const [view, setView] = useState<ViewTransform>({ scale: 1, tx: 0, ty: 0 })
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [clusterCount, setClusterCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [rotationEnabled, setRotationEnabled] = useState(true)
  const [rotationStepDegrees, setRotationStepDegrees] = useState(DEFAULT_ROTATION_STEP_DEGREES)
  const [snappingTolerance, setSnappingTolerance] = useState(TRANSLATION_TOLERANCE_RATIO)
  const [backgroundOpacity, setBackgroundOpacity] = useState(DEFAULT_BACKGROUND_OPACITY)
  const viewRef = useRef(view)
  const clusterCountRef = useRef(clusterCount)

  useEffect(() => {
    piecesRef.current = pieces
  }, [pieces])

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    clusterCountRef.current = clusterCount
  }, [clusterCount])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!board || containerSize.width === 0 || containerSize.height === 0) {
      return
    }
    if (viewInitializedRef.current) {
      return
    }
    setView(fitViewToBoard(board, containerSize))
    viewInitializedRef.current = true
  }, [board, containerSize])

  useEffect(() => {
    let isActive = true
    let bitmaps: ImageBitmap[] = []

    const loadPuzzle = async () => {
      if (!puzzleId) {
        setError('Missing puzzle id')
        setStatus('error')
        return
      }

      setStatus('loading')
      setError(null)
      viewInitializedRef.current = false

      try {
        const containerRect = containerRef.current?.getBoundingClientRect()
        const [puzzle, settings, progress] = await Promise.all([
          getPuzzle(puzzleId),
          getSettings(),
          getProgress(puzzleId),
        ])
        if (!puzzle) {
          throw new Error('Puzzle not found.')
        }
        const image = await getImage(puzzle.imageId)
        if (!image) {
          throw new Error('Puzzle image not found.')
        }

        const decoded = await decodeImage(image.blob)
        const edges = puzzle.edges
        if (!isPuzzleEdges(edges)) {
          throw new Error('Puzzle data is incomplete.')
        }

        const topology = buildTopologyFromSeams(edges.rows, edges.cols, edges.seams)
        const basePadding = Math.round(Math.max(decoded.width, decoded.height) * 0.5)
        const containerPadding = containerRect
          ? Math.round(Math.max(containerRect.width, containerRect.height) * 0.5)
          : 0
        const padding = Math.max(puzzle.board?.padding ?? 0, basePadding, containerPadding)
        const rasters = await rasterizePieces(
          decoded.source,
          { width: decoded.width, height: decoded.height },
          topology,
        )
        bitmaps = rasters.map((raster) => raster.bitmap)

        const cellWidth = decoded.width / topology.cols
        const cellHeight = decoded.height / topology.rows
        const rng = createSeededRng(puzzle.seed)
        const rotationStep = settings.rotationStep ?? DEFAULT_ROTATION_STEP_DEGREES
        const rotationEnabledSetting = settings.rotationEnabled
        let nextPieces = buildPiecesFromRasters(
          rasters,
          topology,
          cellWidth,
          cellHeight,
          rng,
          rotationEnabledSetting,
          (rotationStep * Math.PI) / 180,
          decoded.width,
          decoded.height,
          padding,
        )

        if (!isActive) {
          return
        }

        const persistedPieces = parsePersistedPieces(progress?.pieces, nextPieces.length)
        const persistedClusters = parseClusterSnapshot(progress?.clusters, nextPieces.length)
        const persistedView = parseProgressView(progress?.view)

        const unionFind =
          (persistedClusters ? UnionFind.fromParents(persistedClusters) : null) ??
          buildUnionFindFromPersistedPieces(persistedPieces, nextPieces.length) ??
          new UnionFind(nextPieces.length)

        nextPieces = applyPersistedPieces(nextPieces, persistedPieces).map((piece) => ({
          ...piece,
          clusterId: unionFind.find(piece.cellIndex),
        }))

        if (typeof progress?.completedAt === 'number') {
          completedAtRef.current = progress.completedAt
        }

        topologyRef.current = topology
        metricsRef.current = { cellWidth, cellHeight }
        neighborGraphRef.current = buildNeighborGraph(topology)

        unionFindRef.current = unionFind
        spatialIndexRef.current = new SpatialIndex(Math.max(cellWidth, cellHeight) * 1.25)
        refreshSpatialIndex(spatialIndexRef.current, nextPieces)

        setPieces(nextPieces)
        setClusterCount(countClusters(nextPieces, unionFind))
        zCounterRef.current = nextPieces.reduce((max, piece) => Math.max(max, piece.zIndex), 0)

        setBoard({ width: decoded.width, height: decoded.height, padding })
        setRotationEnabled(rotationEnabledSetting)
        setRotationStepDegrees(rotationStep)
        setSnappingTolerance(settings.snappingTolerance ?? TRANSLATION_TOLERANCE_RATIO)
        setBackgroundOpacity(settings.backgroundGuideOpacity ?? DEFAULT_BACKGROUND_OPACITY)

        if (backgroundReleaseRef.current) {
          backgroundReleaseRef.current()
        }
        backgroundReleaseRef.current = decoded.release ?? null
        setBackground({ image: decoded.source, width: decoded.width, height: decoded.height })

        if (persistedView) {
          setView(persistedView)
          viewInitializedRef.current = true
        } else if (containerSize.width > 0 && containerSize.height > 0) {
          setView(fitViewToBoard({ width: decoded.width, height: decoded.height, padding }, containerSize))
          viewInitializedRef.current = true
        }

        setStatus('ready')
      } catch (err) {
        if (isActive) {
          const message = err instanceof Error ? err.message : 'Failed to load puzzle'
          setError(message)
          setStatus('error')
        }
      }
    }

    loadPuzzle()

    return () => {
      isActive = false
      bitmaps.forEach((bitmap) => bitmap.close())
      if (backgroundReleaseRef.current) {
        backgroundReleaseRef.current()
        backgroundReleaseRef.current = null
      }
    }
  }, [puzzleId])

  const selectedPiece = useMemo(
    () => pieces.find((piece) => piece.id === selectedPieceId) ?? null,
    [pieces, selectedPieceId],
  )
  const activeClusterId = selectedPiece?.clusterId ?? null

  const scene: PuzzleScene = useMemo(
    () => ({
      pieces: pieces.map((piece) => ({
        id: piece.id,
        bitmap: piece.bitmap,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        width: piece.width,
        height: piece.height,
        zIndex: piece.zIndex,
        isDragging: piece.isDragging,
      })),
      view,
      background: background
        ? {
            image: background.image,
            width: background.width,
            height: background.height,
            opacity: backgroundOpacity,
          }
        : undefined,
      board: board ?? undefined,
    }),
    [pieces, view, background, board, backgroundOpacity],
  )

  const pointerControls = useMemo(
    () => ({
      view,
      onViewChange: setView,
      onSelectPiece: (worldPoint: Vec2) => {
        const pickable = piecesRef.current.map((piece) => ({
          id: piece.id,
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation,
          width: piece.width,
          height: piece.height,
          zIndex: piece.zIndex,
        }))
        const hit = hitTestPieces(pickable, worldPoint)
        if (!hit) {
          setSelectedPieceId(null)
          return null
        }
        setSelectedPieceId(hit.id)
        return hit.id
      },
      onDragStart: (pieceId: string) => {
        const current = piecesRef.current
        const activePiece = current.find((piece) => piece.id === pieceId)
        if (!activePiece) {
          return
        }
        const clusterId = activePiece.clusterId
        draggingClusterRef.current = clusterId

        let zIndex = zCounterRef.current + 1
        const nextPieces = current.map((piece) =>
          piece.clusterId === clusterId
            ? {
                ...piece,
                isDragging: true,
                zIndex: zIndex++,
              }
            : piece,
        )
        zCounterRef.current = zIndex
        setPiecesAndSync(nextPieces)
      },
      onDrag: (_pieceId: string, delta: Vec2) => {
        const clusterId = draggingClusterRef.current
        if (clusterId === null) {
          return
        }
        const nextPieces = piecesRef.current.map((piece) =>
          piece.clusterId === clusterId
            ? {
                ...piece,
                x: piece.x + delta.x,
                y: piece.y + delta.y,
              }
            : piece,
        )
        const constrained = board ? clampClusterToBoard(nextPieces, clusterId, board) : nextPieces
        setPiecesAndSync(constrained)
        const spatial = spatialIndexRef.current
        if (spatial) {
          updateSpatialIndexForCluster(spatial, constrained, clusterId)
        }
      },
      onDragEnd: () => {
        const clusterId = draggingClusterRef.current
        draggingClusterRef.current = null
        if (clusterId === null) {
          return
        }

        let nextPieces = piecesRef.current.map((piece) =>
          piece.clusterId === clusterId ? { ...piece, isDragging: false } : piece,
        )

        if (board) {
          nextPieces = clampClusterToBoard(nextPieces, clusterId, board)
        }

        const snapResult = attemptSnap(clusterId, nextPieces)
        const snappedPieces = snapResult ?? nextPieces
        const boundedPieces =
          board && snappedPieces ? clampAllClustersToBoard(snappedPieces, board) : snappedPieces

        setPiecesAndSync(boundedPieces)
        const spatial = spatialIndexRef.current
        if (spatial) {
          refreshSpatialIndex(spatial, boundedPieces)
        }
      },
      allowPanOnEmpty: true,
      minScale: 0.2,
      maxScale: 5,
    }),
    [view],
  )

  useEffect(() => {
    if (!puzzleId || status !== 'ready') {
      return
    }

    if (persistenceRef.current) {
      void persistenceRef.current.flush()
      persistenceRef.current.dispose()
      persistenceRef.current = null
    }

    persistenceRef.current = createProgressPersistence({
      puzzleId,
      getSnapshot: () => {
        const currentPieces = piecesRef.current
        const unionFind = unionFindRef.current
        if (!currentPieces.length || !unionFind) {
          return null
        }
        const viewSnapshot = viewRef.current
        if (
          !Number.isFinite(viewSnapshot.scale) ||
          !Number.isFinite(viewSnapshot.tx) ||
          !Number.isFinite(viewSnapshot.ty)
        ) {
          return null
        }

        const isComplete = currentPieces.length > 0 && clusterCountRef.current <= 1
        if (isComplete && !completedAtRef.current) {
          completedAtRef.current = Date.now()
        }

        return {
          pieces: currentPieces.map((piece) => ({
            cellIndex: piece.cellIndex,
            x: piece.x,
            y: piece.y,
            rotation: piece.rotation,
            zIndex: piece.zIndex,
            clusterId: piece.clusterId,
          })),
          clusters: unionFind.snapshot(),
          view: viewSnapshot,
          completedAt: completedAtRef.current,
        }
      },
      saveProgress,
      onError: (error) => {
        console.error('Failed to save progress', error)
      },
    })

    return () => {
      if (persistenceRef.current) {
        void persistenceRef.current.flush()
        persistenceRef.current.dispose()
      }
      persistenceRef.current = null
    }
  }, [puzzleId, status])

  useEffect(() => {
    if (status !== 'ready') {
      return
    }
    persistenceRef.current?.notifyChange()
  }, [pieces, view, status])

  const handleZoomIn = () => zoomBy(1.12)
  const handleZoomOut = () => zoomBy(0.9)
  const handleRecenter = () => {
    if (!board || !containerRef.current) {
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    setView(fitViewToBoard(board, { width: rect.width, height: rect.height }))
  }

  const rotationStepRadians = (rotationStepDegrees * Math.PI) / 180
  const handleRotateLeft = () => rotateCluster(-rotationStepRadians)
  const handleRotateRight = () => rotateCluster(rotationStepRadians)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return
        }
      }
      if (event.key === '[') {
        event.preventDefault()
        handleRotateLeft()
      } else if (event.key === ']') {
        event.preventDefault()
        handleRotateRight()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleRotateLeft, handleRotateRight])

  function setPiecesAndSync(nextPieces: PieceRuntime[]) {
    piecesRef.current = nextPieces
    setPieces(nextPieces)
  }

  function toSnapPiece(piece: PieceRuntime): PieceState {
    return {
      id: piece.id,
      cellIndex: piece.cellIndex,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      width: piece.width,
      height: piece.height,
      clusterId: piece.clusterId,
      anchorOffset: piece.anchorOffset,
    }
  }

  function rotateCluster(delta: number) {
    if (activeClusterId === null || !rotationEnabled) {
      return
    }
    const current = piecesRef.current
    const clusterPieces = current.filter((piece) => piece.clusterId === activeClusterId)
    if (clusterPieces.length === 0) {
      return
    }
    const center = getClusterCenter(clusterPieces)
    const nextPieces = current.map((piece) => {
      if (piece.clusterId !== activeClusterId) {
        return piece
      }
      const rotated = rotatePoint({ x: piece.x - center.x, y: piece.y - center.y }, delta)
      return {
        ...piece,
        x: center.x + rotated.x,
        y: center.y + rotated.y,
        rotation: normalizeAngle(piece.rotation + delta),
      }
    })
    const constrained = board ? clampClusterToBoard(nextPieces, activeClusterId, board) : nextPieces
    setPiecesAndSync(constrained)
    const spatial = spatialIndexRef.current
    if (spatial) {
      updateSpatialIndexForCluster(spatial, constrained, activeClusterId)
    }
  }

  function attemptSnap(clusterId: number, currentPieces: PieceRuntime[]): PieceRuntime[] | null {
    const topology = topologyRef.current
    const metrics = metricsRef.current
    const spatial = spatialIndexRef.current
    const neighborGraph = neighborGraphRef.current
    const unionFind = unionFindRef.current
    if (!topology || !metrics || !spatial || !neighborGraph || !unionFind) {
      return null
    }

    const snapPieces = currentPieces.map((piece) => toSnapPiece(piece))
    const rotationToleranceDegrees = rotationStepDegrees >= 45 ? 12 : 6
    const snap = findSnapCandidate({
      pieces: snapPieces,
      activeClusterId: clusterId,
      topology,
      cellWidth: metrics.cellWidth,
      cellHeight: metrics.cellHeight,
      spatialIndex: spatial,
      options: {
        translationTolerance: Math.min(metrics.cellWidth, metrics.cellHeight) * snappingTolerance,
        rotationToleranceDegrees,
      },
      neighborGraph,
    })

    if (!snap) {
      return null
    }

    const activePiece = currentPieces.find((piece) => piece.id === snap.pieceId)
    const neighborPiece = currentPieces.find((piece) => piece.id === snap.neighborId)
    if (!activePiece || !neighborPiece) {
      return null
    }

    const movedPieces = currentPieces.map((piece) =>
      piece.clusterId === clusterId
        ? {
            ...piece,
            x: piece.x + snap.deltaX,
            y: piece.y + snap.deltaY,
          }
        : piece,
    )

    unionFind.union(activePiece.cellIndex, neighborPiece.cellIndex)
    const updatedPieces = movedPieces.map((piece) => ({
      ...piece,
      clusterId: unionFind.find(piece.cellIndex),
    }))

    const spatialIndex = spatialIndexRef.current
    if (spatialIndex) {
      updateSpatialIndexForCluster(spatialIndex, updatedPieces, unionFind.find(activePiece.cellIndex))
    }

    setClusterCount(countClusters(updatedPieces, unionFind))
    return updatedPieces
  }

  function zoomBy(factor: number) {
    const container = containerRef.current
    if (!container) {
      return
    }
    const rect = container.getBoundingClientRect()
    const screenPoint = { x: rect.width / 2, y: rect.height / 2 }
    setView((prev) => zoomAt(prev, screenPoint, factor))
  }

  if (status === 'loading') {
    return (
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading your puzzle...
          </Typography>
        </Stack>
      </Paper>
    )
  }

  if (status === 'error') {
    return (
      <Stack spacing={2}>
        <Alert severity="error" variant="outlined">
          {error ?? 'Puzzle unavailable.'}
        </Alert>
        <Button variant="contained" href="/library">
          Back to library
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h3">Puzzle play</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Drag pieces, use the controls to zoom or rotate, and snap edges together.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 280px' },
          gap: { xs: 2, md: 3 },
          alignItems: 'start',
        }}
      >
        <Stack spacing={1.5}>
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              height: { xs: '70vh', md: 'calc(100vh - 260px)' },
              minHeight: 480,
              borderRadius: 0,
              overflow: 'hidden',
              border: '1px solid var(--app-outline)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
            }}
          >
            <PuzzleCanvas scene={scene} pointerControls={pointerControls} />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <ProgressHUD totalPieces={pieces.length} clusterCount={clusterCount} />
            {isMobile ? (
              <Button
                variant="contained"
                onClick={() => setControlsOpen(true)}
                aria-label="Open puzzle controls"
                aria-controls="puzzle-controls-drawer"
                aria-haspopup="dialog"
              >
                Controls
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {isMobile ? (
          <Drawer
            anchor="bottom"
            open={controlsOpen}
            onClose={() => setControlsOpen(false)}
            PaperProps={{ id: 'puzzle-controls-drawer', sx: { p: 2, borderRadius: '16px 16px 0 0' } }}
          >
            <Stack spacing={2}>
              <ZoomPanControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onRecenter={handleRecenter} />
              <PieceControls
                onRotateLeft={handleRotateLeft}
                onRotateRight={handleRotateRight}
                disabled={activeClusterId === null || !rotationEnabled}
                rotationStep={rotationStepDegrees}
              />
            </Stack>
          </Drawer>
        ) : (
          <Stack spacing={2} sx={{ position: 'sticky', top: 88 }}>
            <ZoomPanControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onRecenter={handleRecenter} />
            <PieceControls
              onRotateLeft={handleRotateLeft}
              onRotateRight={handleRotateRight}
              disabled={activeClusterId === null || !rotationEnabled}
              rotationStep={rotationStepDegrees}
            />
          </Stack>
        )}
      </Box>
    </Stack>
  )

}

function buildPiecesFromRasters(
  rasters: Array<{
    cellIndex: number
    bitmap: ImageBitmap
    width: number
    height: number
    offsetX: number
    offsetY: number
  }>,
  topology: PuzzleTopology,
  cellWidth: number,
  cellHeight: number,
  rng: ReturnType<typeof createSeededRng>,
  rotationEnabled: boolean,
  rotationStepRadians: number,
  boardWidth: number,
  boardHeight: number,
  padding: number,
): PieceRuntime[] {
  return rasters.map((raster, index) => {
    const row = Math.floor(raster.cellIndex / topology.cols)
    const col = raster.cellIndex % topology.cols
    const cellCenter = {
      x: (col + 0.5) * cellWidth,
      y: (row + 0.5) * cellHeight,
    }
    const bboxCenter = {
      x: raster.offsetX + raster.width / 2,
      y: raster.offsetY + raster.height / 2,
    }
    const scatter = randomScatterOffset(rng, bboxCenter, {
      width: boardWidth,
      height: boardHeight,
      padding,
    })
    const steps = Math.max(1, Math.round((Math.PI * 2) / rotationStepRadians))
    const rotation = rotationEnabled ? rng.nextInt(steps) * rotationStepRadians : 0
    const radius = Math.hypot(raster.width, raster.height) / 2
    const minX = -padding + radius
    const maxX = boardWidth + padding - radius
    const minY = -padding + radius
    const maxY = boardHeight + padding - radius
    const x = clamp(bboxCenter.x + scatter.x, minX, maxX)
    const y = clamp(bboxCenter.y + scatter.y, minY, maxY)

    return {
      id: `piece-${raster.cellIndex}`,
      cellIndex: raster.cellIndex,
      x,
      y,
      rotation,
      width: raster.width,
      height: raster.height,
      bitmap: raster.bitmap,
      anchorOffset: {
        x: cellCenter.x - bboxCenter.x,
        y: cellCenter.y - bboxCenter.y,
      },
      clusterId: raster.cellIndex,
      zIndex: index,
    }
  })
}

function randomScatterOffset(
  rng: ReturnType<typeof createSeededRng>,
  bboxCenter: Vec2,
  board: { width: number; height: number; padding: number },
): Vec2 {
  const buffer = board.padding * 0.25
  const minX = -buffer
  const maxX = board.width + buffer
  const minY = -buffer
  const maxY = board.height + buffer
  const targetX = rng.nextRange(minX, maxX)
  const targetY = rng.nextRange(minY, maxY)
  return {
    x: targetX - bboxCenter.x,
    y: targetY - bboxCenter.y,
  }
}

function clampAllClustersToBoard(pieces: PieceRuntime[], board: BoardState): PieceRuntime[] {
  const clusters = new Set(pieces.map((piece) => piece.clusterId))
  let nextPieces = pieces
  for (const clusterId of clusters) {
    nextPieces = clampClusterToBoard(nextPieces, clusterId, board)
  }
  return nextPieces
}

function clampClusterToBoard(pieces: PieceRuntime[], clusterId: number, board: BoardState): PieceRuntime[] {
  const clusterPieces = pieces.filter((piece) => piece.clusterId === clusterId)
  if (!clusterPieces.length) {
    return pieces
  }
  const padding = board.padding ?? 0
  const bounds = clusterPieces.reduce(
    (acc, piece) => {
      const radius = Math.hypot(piece.width, piece.height) / 2
      acc.minX = Math.min(acc.minX, piece.x - radius)
      acc.maxX = Math.max(acc.maxX, piece.x + radius)
      acc.minY = Math.min(acc.minY, piece.y - radius)
      acc.maxY = Math.max(acc.maxY, piece.y + radius)
      return acc
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )

  const minX = -padding
  const maxX = board.width + padding
  const minY = -padding
  const maxY = board.height + padding

  let deltaX = 0
  if (bounds.minX < minX) {
    deltaX = minX - bounds.minX
  }
  if (bounds.maxX + deltaX > maxX) {
    deltaX = Math.min(deltaX, maxX - bounds.maxX)
  }

  let deltaY = 0
  if (bounds.minY < minY) {
    deltaY = minY - bounds.minY
  }
  if (bounds.maxY + deltaY > maxY) {
    deltaY = Math.min(deltaY, maxY - bounds.maxY)
  }

  if (deltaX === 0 && deltaY === 0) {
    return pieces
  }

  return pieces.map((piece) =>
    piece.clusterId === clusterId
      ? {
          ...piece,
          x: piece.x + deltaX,
          y: piece.y + deltaY,
        }
      : piece,
  )
}

function refreshSpatialIndex(spatial: SpatialIndex, pieces: PieceRuntime[]) {
  spatial.clear()
  for (const piece of pieces) {
    spatial.insert(piece.id, getPieceAabb(piece))
  }
}

function updateSpatialIndexForCluster(spatial: SpatialIndex, pieces: PieceRuntime[], clusterId: number) {
  for (const piece of pieces) {
    if (piece.clusterId === clusterId) {
      spatial.update(piece.id, getPieceAabb(piece))
    }
  }
}

function getClusterCenter(pieces: PieceRuntime[]): Vec2 {
  const sum = pieces.reduce(
    (acc, piece) => {
      acc.x += piece.x
      acc.y += piece.y
      return acc
    },
    { x: 0, y: 0 },
  )
  return { x: sum.x / pieces.length, y: sum.y / pieces.length }
}

function rotatePoint(point: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  let next = angle % twoPi
  if (next > Math.PI) {
    next -= twoPi
  }
  if (next < -Math.PI) {
    next += twoPi
  }
  return next
}

function fitViewToBoard(board: BoardState, container: { width: number; height: number }): ViewTransform {
  const padding = board.padding ?? 0
  const contentWidth = board.width + padding * 2
  const contentHeight = board.height + padding * 2
  const scale = Math.min(container.width / contentWidth, container.height / contentHeight)
  const offsetX = (container.width - contentWidth * scale) / 2
  const offsetY = (container.height - contentHeight * scale) / 2
  return {
    scale,
    tx: offsetX + padding * scale,
    ty: offsetY + padding * scale,
  }
}

function zoomAt(view: ViewTransform, screen: Vec2, factor: number): ViewTransform {
  const scale = clamp(view.scale * factor, 0.2, 5)
  const world = {
    x: (screen.x - view.tx) / view.scale,
    y: (screen.y - view.ty) / view.scale,
  }
  return {
    scale,
    tx: screen.x - world.x * scale,
    ty: screen.y - world.y * scale,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function countClusters(pieces: PieceRuntime[], unionFind: UnionFind): number {
  const roots = new Set<number>()
  for (const piece of pieces) {
    roots.add(unionFind.find(piece.cellIndex))
  }
  return roots.size
}

function isPuzzleEdges(edges: PuzzleEdges | null | undefined): edges is PuzzleEdges {
  return Boolean(edges && typeof edges.rows === 'number' && typeof edges.cols === 'number' && edges.seams)
}

function parsePersistedPieces(
  raw: unknown,
  expectedCount: number,
): PersistedPieceState[] | null {
  if (!Array.isArray(raw)) {
    return null
  }

  const cleaned: PersistedPieceState[] = []

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const candidate = entry as PersistedPieceState
    if (
      !isFiniteNumber(candidate.cellIndex) ||
      !isFiniteNumber(candidate.x) ||
      !isFiniteNumber(candidate.y) ||
      !isFiniteNumber(candidate.rotation) ||
      !isFiniteNumber(candidate.zIndex)
    ) {
      continue
    }
    if (candidate.cellIndex < 0 || candidate.cellIndex >= expectedCount) {
      continue
    }
    const clusterId = isFiniteNumber(candidate.clusterId) ? candidate.clusterId : undefined
    cleaned.push({
      cellIndex: candidate.cellIndex,
      x: candidate.x,
      y: candidate.y,
      rotation: candidate.rotation,
      zIndex: candidate.zIndex,
      clusterId,
    })
  }

  return cleaned.length ? cleaned : null
}

function applyPersistedPieces(
  pieces: PieceRuntime[],
  persisted: PersistedPieceState[] | null,
): PieceRuntime[] {
  if (!persisted) {
    return pieces
  }
  const lookup = new Map(persisted.map((entry) => [entry.cellIndex, entry]))
  return pieces.map((piece) => {
    const saved = lookup.get(piece.cellIndex)
    if (!saved) {
      return piece
    }
    return {
      ...piece,
      x: saved.x,
      y: saved.y,
      rotation: saved.rotation,
      zIndex: saved.zIndex,
    }
  })
}

function parseClusterSnapshot(raw: unknown, expectedCount: number): number[] | null {
  if (!Array.isArray(raw) || raw.length !== expectedCount) {
    return null
  }
  const parents = raw.map((value, index) => {
    if (!isFiniteNumber(value)) {
      return index
    }
    if (value < 0 || value >= expectedCount) {
      return index
    }
    return value
  })
  return parents
}

function buildUnionFindFromPersistedPieces(
  persisted: PersistedPieceState[] | null,
  expectedCount: number,
): UnionFind | null {
  if (!persisted || expectedCount < 1) {
    return null
  }

  const groups = new Map<number, number[]>()
  for (const entry of persisted) {
    if (!isFiniteNumber(entry.clusterId)) {
      continue
    }
    const list = groups.get(entry.clusterId) ?? []
    list.push(entry.cellIndex)
    groups.set(entry.clusterId, list)
  }

  if (groups.size === 0) {
    return null
  }

  const unionFind = new UnionFind(expectedCount)
  for (const list of groups.values()) {
    if (list.length < 2) {
      continue
    }
    const [root, ...rest] = list
    for (const member of rest) {
      unionFind.union(root, member)
    }
  }

  return unionFind
}

function parseProgressView(raw: unknown): ViewTransform | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const candidate = raw as ViewTransform
  if (
    !isFiniteNumber(candidate.scale) ||
    !isFiniteNumber(candidate.tx) ||
    !isFiniteNumber(candidate.ty)
  ) {
    return null
  }
  if (candidate.scale <= 0) {
    return null
  }
  return {
    scale: clamp(candidate.scale, 0.2, 5),
    tx: candidate.tx,
    ty: candidate.ty,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

import { Box } from '@mui/material'
import { useRef } from 'react'
import { identityView } from './viewTransform'
import { usePointerControls, type PointerControlsConfig } from './usePointerControls'
import { usePuzzleRenderer, type PuzzleScene } from './usePuzzleRenderer'

export type PuzzleCanvasProps = {
  scene?: PuzzleScene
  pointerControls?: PointerControlsConfig
}

const emptyScene: PuzzleScene = {
  pieces: [],
  view: identityView(),
}

export default function PuzzleCanvas({ scene, pointerControls }: PuzzleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  usePuzzleRenderer(canvasRef, scene ?? emptyScene)
  usePointerControls(canvasRef, pointerControls)

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />
    </Box>
  )
}

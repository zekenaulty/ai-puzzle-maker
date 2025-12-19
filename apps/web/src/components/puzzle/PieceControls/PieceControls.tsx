import { Paper, Stack, Typography } from '@mui/material'
import RotationControls from './RotationControls'

export type PieceControlsProps = {
  onRotateLeft: () => void
  onRotateRight: () => void
  disabled?: boolean
  rotationStep: number
}

export default function PieceControls({
  onRotateLeft,
  onRotateRight,
  disabled,
  rotationStep,
}: PieceControlsProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Piece controls
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Rotation step: {rotationStep} degrees
        </Typography>
        <RotationControls onRotateLeft={onRotateLeft} onRotateRight={onRotateRight} disabled={disabled} />
      </Stack>
    </Paper>
  )
}

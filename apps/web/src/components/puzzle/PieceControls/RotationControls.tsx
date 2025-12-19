import { Button, ButtonGroup } from '@mui/material'

export type RotationControlsProps = {
  onRotateLeft: () => void
  onRotateRight: () => void
  disabled?: boolean
}

export default function RotationControls({ onRotateLeft, onRotateRight, disabled }: RotationControlsProps) {
  return (
    <ButtonGroup variant="outlined" size="small" fullWidth aria-label="Rotation controls">
      <Button onClick={onRotateLeft} disabled={disabled} aria-label="Rotate selection left">
        Rotate left
      </Button>
      <Button onClick={onRotateRight} disabled={disabled} aria-label="Rotate selection right">
        Rotate right
      </Button>
    </ButtonGroup>
  )
}

import { Button, ButtonGroup, Paper, Stack, Typography } from '@mui/material'

export type ZoomPanControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onRecenter: () => void
}

export default function ZoomPanControls({ onZoomIn, onZoomOut, onRecenter }: ZoomPanControlsProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          View controls
        </Typography>
        <ButtonGroup variant="outlined" size="small" fullWidth aria-label="Zoom controls">
          <Button onClick={onZoomOut} aria-label="Zoom out">
            -
          </Button>
          <Button onClick={onZoomIn} aria-label="Zoom in">
            +
          </Button>
        </ButtonGroup>
        <Button variant="outlined" size="small" onClick={onRecenter} aria-label="Recenter view">
          Recenter
        </Button>
      </Stack>
    </Paper>
  )
}

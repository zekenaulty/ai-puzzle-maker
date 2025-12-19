import { Box, Slider, Stack, Typography } from '@mui/material'

export type PieceCountSelectorProps = {
  value: number
  onChange: (value: number) => void
  marks: Array<{ value: number; label: string }>
  min?: number
  max?: number
}

export default function PieceCountSelector({
  value,
  onChange,
  marks,
  min = 80,
  max = 900,
}: PieceCountSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Piece count
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {value} pieces
        </Typography>
      </Stack>
      <Box sx={{ px: 1 }}>
        <Slider
          value={value}
          min={min}
          max={max}
          marks={marks}
          step={10}
          onChange={(_event, nextValue) => {
            if (typeof nextValue === 'number') {
              onChange(nextValue)
            }
          }}
        />
      </Box>
    </Stack>
  )
}

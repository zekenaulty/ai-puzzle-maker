import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import type { AspectRatioOption } from './createOptions'
import type { AspectRatio } from '../../storage/types'

export type AspectRatioSelectorProps = {
  options: AspectRatioOption[]
  value: AspectRatio
  onChange: (value: AspectRatio) => void
}

export default function AspectRatioSelector({ options, value, onChange }: AspectRatioSelectorProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Aspect ratio
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_event, nextValue) => {
          if (nextValue) {
            onChange(nextValue)
          }
        }}
        sx={{ flexWrap: 'wrap' }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={{ px: 2.5, py: 1.5 }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.hint}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}

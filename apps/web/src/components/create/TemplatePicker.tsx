import { Grid, Paper, Stack, Typography } from '@mui/material'
import type { TemplateOption } from './createOptions'

export type TemplatePickerProps = {
  options: TemplateOption[]
  value: string
  onChange: (id: string) => void
}

export default function TemplatePicker({ options, value, onChange }: TemplatePickerProps) {
  const grouped = groupByCategory(options)

  return (
    <Stack spacing={3}>
      {Array.from(grouped.entries()).map(([category, items]) => (
        <Stack key={category} spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {category}
          </Typography>
          <Grid container spacing={2}>
            {items.map((option) => {
              const isSelected = option.id === value
              return (
                <Grid key={option.id} item xs={12} sm={6}>
                  <Paper
                    onClick={() => onChange(option.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onChange(option.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0c6a64' : '1px solid var(--app-outline)',
                      backgroundColor: isSelected ? 'rgba(12, 106, 100, 0.08)' : 'var(--app-surface)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(15, 19, 24, 0.12)',
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {option.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              )
            })}
          </Grid>
        </Stack>
      ))}
    </Stack>
  )
}

function groupByCategory(options: TemplateOption[]): Map<string, TemplateOption[]> {
  const map = new Map<string, TemplateOption[]>()
  for (const option of options) {
    const list = map.get(option.category) ?? []
    list.push(option)
    map.set(option.category, list)
  }
  return map
}

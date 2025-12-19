import { Chip, Stack, Typography } from '@mui/material'
import type { TagGroup } from './createOptions'

export type StyleMultiSelectProps = {
  groups: TagGroup[]
  value: string[]
  onChange: (next: string[]) => void
}

export default function StyleMultiSelect({ groups, value, onChange }: StyleMultiSelectProps) {
  const toggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  return (
    <Stack spacing={2}>
      {groups.map((group) => (
        <Stack key={group.id} spacing={1}>
          <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {group.label}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {group.tags.map((tag) => {
              const selected = value.includes(tag.id)
              return (
                <Chip
                  key={tag.id}
                  label={tag.label}
                  onClick={() => toggleTag(tag.id)}
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              )
            })}
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

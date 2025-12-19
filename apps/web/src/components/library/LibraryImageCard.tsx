import { Box, Button, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import type { ImageRecord } from '../../storage/types'

export type LibraryImageCardProps = {
  image: ImageRecord
  previewUrl?: string
  puzzleCount?: number
  onCreatePuzzle?: () => void
  onDelete?: () => void
  busy?: boolean
}

export default function LibraryImageCard({
  image,
  previewUrl,
  puzzleCount = 0,
  onCreatePuzzle,
  onDelete,
  busy,
}: LibraryImageCardProps) {
  const title = image.promptMeta?.title ?? (image.source === 'generated' ? 'Generated image' : 'Uploaded image')
  const styleCount = image.promptMeta?.styleTags?.length ?? 0
  const createdAt = new Date(image.createdAt).toLocaleDateString()
  const canDelete = puzzleCount === 0 && Boolean(onDelete)

  return (
    <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative', paddingTop: '70%', backgroundColor: 'rgba(0,0,0,0.05)' }}>
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt={image.promptMeta?.altText ?? title}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
      </Box>
      <Stack spacing={1.2} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {createdAt} - {image.width}x{image.height}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            size="small"
            label={image.source === 'generated' ? 'AI generated' : 'Uploaded'}
            color={image.source === 'generated' ? 'primary' : 'default'}
            variant={image.source === 'generated' ? 'filled' : 'outlined'}
          />
          {styleCount ? (
            <Chip size="small" label={`${styleCount} style tags`} variant="outlined" />
          ) : null}
          <Chip size="small" label={`${puzzleCount} puzzles`} variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
          <Button
            size="small"
            variant="contained"
            onClick={onCreatePuzzle}
            disabled={!onCreatePuzzle || busy}
            fullWidth
          >
            Create puzzle
          </Button>
          <Tooltip title={puzzleCount > 0 ? 'Delete puzzles first' : 'Delete image'}>
            <span style={{ width: '72px' }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={onDelete}
                disabled={!canDelete || busy}
                fullWidth
              >
                Delete
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  )
}

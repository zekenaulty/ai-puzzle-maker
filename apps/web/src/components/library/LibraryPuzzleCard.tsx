import { Box, Button, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { ProgressRecord, PuzzleRecord } from '../../storage/types'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export type LibraryPuzzleCardProps = {
  puzzle: PuzzleRecord
  progress?: ProgressRecord
  previewUrl?: string
  onReset?: () => void
  onDelete?: () => void
  loading?: boolean
}

export default function LibraryPuzzleCard({
  puzzle,
  progress,
  previewUrl,
  onReset,
  onDelete,
  loading,
}: LibraryPuzzleCardProps) {
  const status = progress?.completedAt
    ? 'Completed'
    : progress?.lastSavedAt
      ? 'In progress'
      : 'Not started'
  const progressValue = progress?.completedAt ? 100 : progress?.lastSavedAt ? 35 : 0

  return (
    <Paper sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative', paddingTop: '65%', backgroundColor: 'rgba(0,0,0,0.05)' }}>
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Puzzle preview"
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
      <Stack spacing={1.5} sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Puzzle {puzzle.puzzleId.slice(0, 8)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {puzzle.pieceCount} pieces - {new Date(puzzle.createdAt).toLocaleDateString()}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ProgressRing value={progressValue} />
          <Typography variant="body2" color="text.secondary">
            {status}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
          <Button component={RouterLink} to={`/play/${puzzle.puzzleId}`} variant="outlined" fullWidth disabled={loading}>
            {status === 'Completed' ? 'Replay' : 'Resume'}
          </Button>
          <Tooltip title="Reset progress">
            <span>
              <IconButton onClick={onReset} disabled={!onReset || loading}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete puzzle">
            <span>
              <IconButton onClick={onDelete} disabled={!onDelete || loading}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  )
}

function ProgressRing({ value }: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" value={value} size={46} thickness={4} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  )
}

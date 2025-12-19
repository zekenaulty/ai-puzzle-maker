import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'

export type ProgressHUDProps = {
  totalPieces: number
  clusterCount: number
}

export default function ProgressHUD({ totalPieces, clusterCount }: ProgressHUDProps) {
  const progress = totalPieces > 0 ? Math.max(0, 1 - clusterCount / totalPieces) : 0
  const percent = Math.round(progress * 100)

  return (
    <Paper sx={{ p: 2, minWidth: 160 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress variant="determinate" value={percent} size={44} thickness={4} />
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
              {percent}%
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Progress
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalPieces - clusterCount} merges done
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

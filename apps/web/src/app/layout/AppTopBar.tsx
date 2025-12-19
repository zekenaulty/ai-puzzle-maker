import { AppBar, Box, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export type AppTopBarProps = {
  onMenuClick?: () => void
}

export default function AppTopBar({ onMenuClick }: AppTopBarProps) {
  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            border: '1px solid rgba(31, 27, 22, 0.1)',
          }}
          aria-label="Open navigation"
        >
          <MenuGlyph />
        </IconButton>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            AI Jigsaw Puzzle Maker
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Create, cut, and solve custom puzzles
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Button component={RouterLink} to="/library" variant="outlined" color="primary">
            Library
          </Button>
          <Button component={RouterLink} to="/create" variant="contained" color="primary">
            Create Puzzle
          </Button>
        </Stack>
        <Button
          component={RouterLink}
          to="/create"
          variant="contained"
          color="primary"
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          Create
        </Button>
      </Toolbar>
    </AppBar>
  )
}

function MenuGlyph() {
  return (
    <Box
      sx={{
        width: 18,
        height: 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ height: 2, borderRadius: 2, backgroundColor: 'currentColor' }} />
      <Box sx={{ height: 2, borderRadius: 2, backgroundColor: 'currentColor', width: '70%' }} />
      <Box sx={{ height: 2, borderRadius: 2, backgroundColor: 'currentColor' }} />
    </Box>
  )
}

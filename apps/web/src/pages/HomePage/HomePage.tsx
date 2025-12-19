import { Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

const highlights = [
  'AI-crafted art with curated styles and mood tags',
  'Premium interlocking seams and crisp piece rasterization',
  'Full client-side play with offline-ready progress saves',
  'Mobile-friendly controls with zoom, rotate, and snapping',
]

const steps = [
  {
    title: 'Compose',
    body: 'Pick a template or write your own prompt. Blend style, mood, and palette tags to guide the AI.',
  },
  {
    title: 'Generate',
    body: 'Our Worker calls Gemini to produce puzzle-ready art, then cuts it into deterministic interlocking pieces.',
  },
  {
    title: 'Solve',
    body: 'Play in the browser with smooth zoom/pan, rotation controls, and satisfying snapping. Resume anytime.',
  },
]

export default function HomePage() {
  return (
    <Stack spacing={4}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack
          spacing={3}
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack spacing={2} flex={1}>
            <Typography variant="overline" sx={{ letterSpacing: '0.14em', color: 'text.secondary' }}>
              AI Jigsaw Puzzle Maker
            </Typography>
            <Typography variant="h3">Generate, cut, and solve beautiful puzzles in your browser.</Typography>
            <Typography variant="body1" color="text.secondary">
              Craft prompts or pick curated templates, generate artwork safely via our Worker, and solve premium
              interlocking jigsaws with rotation, snapping, and fully local saves. No installs, no accounts.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={RouterLink} to="/create" variant="contained" size="large">
                Create a puzzle
              </Button>
              <Button component={RouterLink} to="/library" variant="outlined" size="large">
                Open my library
              </Button>
            </Stack>
          </Stack>
          <Stack spacing={1.25} sx={{ minWidth: { md: 260 }, mt: { xs: 2, md: 0 } }}>
            {highlights.map((item) => (
              <Chip key={item} label={item} color="primary" variant="outlined" sx={{ justifyContent: 'flex-start' }} />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {steps.map((step, index) => (
          <Grid item xs={12} md={4} key={step.title}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(77, 214, 197, 0.14)',
                    color: 'primary.main',
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="h5">{step.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.body}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          <Typography variant="h5">Built for satisfying play</Typography>
          <Typography variant="body2" color="text.secondary">
            Snapping uses spatial indexing and rotation tolerance, progress auto-saves to IndexedDB, and settings let
            you tune snapping strength, rotation steps, background opacity, and accessibility preferences. Everything
            stays on-device; the Worker only handles safe AI calls.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

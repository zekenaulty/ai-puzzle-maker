import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material'

type Milestone = {
  title: string
  detail: string
}

const milestones: Milestone[] = [
  {
    title: 'The spark',
    detail:
      'Zeke Naulty wanted a calm, tactile way to turn any idea or image into a premium jigsaw puzzle. The goal: zero back-end friction and a playful, modern feel.',
  },
  {
    title: 'Pairing with GPT-5.1-Codex-Max',
    detail:
      'We teamed up as builder and coding copilot. Zeke steered vision and UX; GPT-5.1-Codex-Max translated it into code, tests, and iteration-friendly plans.',
  },
  {
    title: 'Building the engine',
    detail:
      'We designed deterministic seams, high-fidelity rasterization, and a WebGL-free canvas renderer so every puzzle feels physical and responsive.',
  },
  {
    title: 'Keeping it local',
    detail:
      'Images, puzzles, and progress live in your browser via IndexedDB. No accounts required, and your creations stay private until you choose to share.',
  },
  {
    title: 'AI plus upload',
    detail:
      'You can generate art with safety guardrails or just upload your own image. Both paths produce the same quality puzzle pieces and save straight to your library.',
  },
]

export default function AboutPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          About this project
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          The AI Puzzle Maker is a collaboration between Zeke Naulty and GPT-5.1-Codex-Max to make puzzle creation feel
          effortless, tactile, and private.
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">What the app does</Typography>
          <Typography variant="body1" color="text.secondary">
            Turn prompts or uploads into beautifully cut jigsaw puzzles. Every image is sliced into interlocking pieces,
            stored locally, and ready to play with smooth zoom, snap, and rotate controls.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="Local-first" color="primary" variant="outlined" />
            <Chip label="Deterministic seams" color="primary" variant="outlined" />
            <Chip label="AI or upload" color="primary" variant="outlined" />
            <Chip label="Progress autosave" color="primary" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Our build story</Typography>
          <Typography variant="body2" color="text.secondary">
            A few highlights from ideation to launch.
          </Typography>
          <Stack spacing={1.5}>
            {milestones.map((item) => (
              <Box key={item.title} sx={{ borderLeft: '3px solid var(--app-outline)', pl: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.detail}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Why it matters</Typography>
          <Typography variant="body1" color="text.secondary">
            Puzzles are meant to be calming. By keeping compute in the browser, giving players control over art, and
            making the engine deterministic, we kept the focus on flow—not setup.
          </Typography>
          <Divider />
          <Typography variant="caption" color="text.secondary">
            Built with care by Zeke Naulty + GPT-5.1-Codex-Max.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

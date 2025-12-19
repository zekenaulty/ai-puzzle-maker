import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd6c5',
      contrastText: '#0b1219',
    },
    secondary: {
      main: '#f0a950',
      contrastText: '#0b1219',
    },
    background: {
      default: '#0b1016',
      paper: '#121a24',
    },
    text: {
      primary: '#e9f0f6',
      secondary: '#9eb3c7',
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--app-bg':
            'radial-gradient(1200px circle at 14% 12%, rgba(77, 214, 197, 0.12), transparent 46%), ' +
            'radial-gradient(900px circle at 82% 10%, rgba(240, 169, 80, 0.12), transparent 42%), ' +
            'linear-gradient(180deg, #0b1016 0%, #0f1620 100%)',
          '--app-surface': '#121a24',
          '--app-surface-strong': '#16202c',
          '--app-outline': 'rgba(233, 240, 246, 0.08)',
        },
        body: {
          background: 'var(--app-bg)',
          color: '#e9f0f6',
          minHeight: '100vh',
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            'linear-gradient(145deg, rgba(20, 30, 40, 0.75) 0%, rgba(18, 26, 36, 0.55) 100%)',
          border: '1px solid var(--app-outline)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(14, 20, 28, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--app-outline)',
        },
      },
    },
  },
})

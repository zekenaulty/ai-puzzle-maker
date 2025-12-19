import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { NavLink } from 'react-router-dom'

export const drawerWidth = 280

type NavItem = {
  label: string
  to: string
  description: string
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/', description: 'Resume and quick start', end: true },
  { label: 'Create Puzzle', to: '/create', description: 'Generate or upload art' },
  { label: 'Library', to: '/library', description: 'Your saved puzzles and images' },
  { label: 'Settings', to: '/settings', description: 'Controls and preferences' },
  { label: 'About', to: '/about', description: 'App details and credits' },
]

export type AppDrawerProps = {
  mobileOpen: boolean
  onClose: () => void
}

export default function AppDrawer({ mobileOpen, onClose }: AppDrawerProps) {
  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.18em' }}>
          Navigation
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Explore
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, pt: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            onClick={onClose}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                backgroundColor: 'rgba(12, 106, 100, 0.12)',
                color: 'primary.main',
              },
            }}
          >
            <ListItemText
              primary={item.label}
              secondary={item.description}
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ px: 3, pb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          AI Puzzle Maker · Cloudflare + Gemini
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ role: 'navigation', 'aria-label': 'Primary navigation' }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: 'var(--app-surface)',
          },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: '1px solid var(--app-outline)',
            backgroundColor: 'var(--app-surface)',
          },
        }}
      >
        {content}
      </Drawer>
    </Box>
  )
}

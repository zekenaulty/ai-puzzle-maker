import { Box, Toolbar } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppDrawer, { drawerWidth } from './AppDrawer'
import AppTopBar from './AppTopBar'

export default function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen((open) => !open)
  }

  const handleDrawerClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--app-bg)' }}>
      <AppTopBar onMenuClick={handleDrawerToggle} />
      <AppDrawer mobileOpen={mobileOpen} onClose={handleDrawerClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${drawerWidth}px` },
          px: { xs: 2, sm: 3 },
          pb: { xs: 3, sm: 4 },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            minHeight: 'calc(100vh - 96px)',
            animation: 'floatIn 480ms ease-out',
            '@keyframes floatIn': {
              from: { opacity: 0, transform: 'translateY(8px)' },
              to: { opacity: 1, transform: 'translateY(0px)' },
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { aspectRatioOptions, pieceCountMarks } from '../../components/create/createOptions'
import { getDefaultSettings, getSettings, saveSettings } from '../../storage/settingsRepo'
import type { SettingsRecord } from '../../storage/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsRecord | null>(null)
  const [initialSettings, setInitialSettings] = useState<SettingsRecord | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const loaded = await getSettings()
        if (!isActive) {
          return
        }
        setSettings(loaded)
        setInitialSettings(loaded)
      } catch (err) {
        if (isActive) {
          const message = err instanceof Error ? err.message : 'Failed to load settings'
          setError(message)
        }
      }
    }
    load()
    return () => {
      isActive = false
    }
  }, [])

  const isDirty = useMemo(() => {
    if (!settings || !initialSettings) {
      return false
    }
    return JSON.stringify(settings) !== JSON.stringify(initialSettings)
  }, [settings, initialSettings])

  const updateSettings = (patch: Partial<Omit<SettingsRecord, 'key'>>) => {
    setSettings((prev) => {
      if (!prev) {
        return prev
      }
      return {
        ...prev,
        ...patch,
        accessibility: {
          ...prev.accessibility,
          ...(patch.accessibility ?? {}),
        },
      }
    })
  }

  const handleSave = async () => {
    if (!settings) {
      return
    }
    setStatus('saving')
    setError(null)
    try {
      await saveSettings(settings)
      setInitialSettings(settings)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      setError(message)
      setStatus('error')
    }
  }

  const handleReset = async () => {
    const defaults = getDefaultSettings()
    setSettings(defaults)
    setStatus('saving')
    setError(null)
    try {
      await saveSettings(defaults)
      setInitialSettings(defaults)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset settings'
      setError(message)
      setStatus('error')
    }
  }

  if (!settings) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading settings...
        </Typography>
      </Paper>
    )
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3">Settings</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Personalize the puzzle experience and default creation settings.
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" variant="outlined">
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6">Gameplay</Typography>
            <Typography variant="body2" color="text.secondary">
              Tune snapping and rotation behavior to match your play style.
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Snapping tolerance
            </Typography>
            <Slider
              value={settings.snappingTolerance}
              min={0.04}
              max={0.15}
              step={0.005}
              valueLabelDisplay="auto"
              onChange={(_event, value) => {
                if (typeof value === 'number') {
                  updateSettings({ snappingTolerance: value })
                }
              }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={settings.rotationEnabled}
                onChange={(event) => updateSettings({ rotationEnabled: event.target.checked })}
              />
            }
            label="Enable rotation"
          />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Rotation step
            </Typography>
            <Select
              value={settings.rotationStep}
              onChange={(event) => updateSettings({ rotationStep: Number(event.target.value) })}
              disabled={!settings.rotationEnabled}
            >
              <MenuItem value={90}>90 degrees</MenuItem>
              <MenuItem value={45}>45 degrees</MenuItem>
              <MenuItem value={30}>30 degrees</MenuItem>
              <MenuItem value={15}>15 degrees</MenuItem>
            </Select>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Background guide opacity
            </Typography>
            <Slider
              value={settings.backgroundGuideOpacity}
              min={0}
              max={0.8}
              step={0.05}
              valueLabelDisplay="auto"
              onChange={(_event, value) => {
                if (typeof value === 'number') {
                  updateSettings({ backgroundGuideOpacity: value })
                }
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6">Creation defaults</Typography>
            <Typography variant="body2" color="text.secondary">
              These settings pre-fill your Create Puzzle page.
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Preferred aspect ratio
            </Typography>
            <Select
              value={settings.preferredAspectRatio}
              onChange={(event) =>
                updateSettings({ preferredAspectRatio: event.target.value as SettingsRecord['preferredAspectRatio'] })
              }
            >
              {aspectRatioOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label} - {option.hint}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Default piece count
            </Typography>
            <Slider
              value={settings.defaultPieceCount}
              min={80}
              max={900}
              step={10}
              marks={pieceCountMarks}
              valueLabelDisplay="auto"
              onChange={(_event, value) => {
                if (typeof value === 'number') {
                  updateSettings({ defaultPieceCount: value })
                }
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Accessibility</Typography>
            <Typography variant="body2" color="text.secondary">
              Adjust contrast and motion preferences.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.accessibility.highContrast}
                onChange={(event) =>
                  updateSettings({
                    accessibility: {
                      ...settings.accessibility,
                      highContrast: event.target.checked,
                    },
                  })
                }
              />
            }
            label="High contrast mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.accessibility.reducedMotion}
                onChange={(event) =>
                  updateSettings({
                    accessibility: {
                      ...settings.accessibility,
                      reducedMotion: event.target.checked,
                    },
                  })
                }
              />
            }
            label="Reduce motion"
          />
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Button variant="outlined" onClick={handleReset}>
          Reset defaults
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!isDirty || status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save settings'}
        </Button>
        {status === 'saved' ? (
          <Typography variant="caption" color="text.secondary">
            Settings saved.
          </Typography>
        ) : null}
      </Stack>
      <Divider />
    </Stack>
  )
}

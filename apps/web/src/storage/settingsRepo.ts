import { getDb } from './db'
import type { SettingsRecord } from './types'

const SETTINGS_KEY: SettingsRecord['key'] = 'global'

const DEFAULT_SETTINGS: SettingsRecord = {
  key: SETTINGS_KEY,
  snappingTolerance: 0.08,
  rotationEnabled: true,
  rotationStep: 90,
  backgroundGuideOpacity: 0.35,
  preferredAspectRatio: '1:1',
  defaultPieceCount: 300,
  accessibility: {
    highContrast: false,
    reducedMotion: false,
  },
}

export async function getSettings(): Promise<SettingsRecord> {
  const db = await getDb()
  const stored = await db.get('settings', SETTINGS_KEY)
  if (!stored) {
    return getDefaultSettings()
  }
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    key: SETTINGS_KEY,
    accessibility: {
      ...DEFAULT_SETTINGS.accessibility,
      ...(stored.accessibility ?? {}),
    },
  }
}

export async function saveSettings(record: SettingsRecord): Promise<void> {
  const db = await getDb()
  await db.put('settings', record)
}

export async function updateSettings(
  patch: Partial<Omit<SettingsRecord, 'key'>>,
): Promise<SettingsRecord> {
  const current = await getSettings()
  const next: SettingsRecord = {
    ...current,
    ...patch,
    key: SETTINGS_KEY,
    accessibility: {
      ...current.accessibility,
      ...(patch.accessibility ?? {}),
    },
  }
  await saveSettings(next)
  return next
}

export function getDefaultSettings(): SettingsRecord {
  return { ...DEFAULT_SETTINGS, accessibility: { ...DEFAULT_SETTINGS.accessibility } }
}

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { Lang } from '../i18n/translations'

export type Theme = 'parchment' | 'dungeon'
export const THEMES: Theme[] = ['parchment', 'dungeon']
export const UI_SCALES = [0.9, 1.0, 1.1, 1.25] as const

// v1 (fontSize) → v2 (uiScale + theme). Exportada para tests.
export function migrateSettingsV1toV2(state: unknown): unknown {
    const s = (state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}) as Record<string, unknown>
    const scaleMap: Record<string, number> = { sm: 0.9, md: 1.0, lg: 1.1 }
    const fontSize = s.fontSize
    const uiScale = typeof fontSize === 'string' && fontSize in scaleMap ? scaleMap[fontSize] : 1.0
    const theme = typeof s.theme === 'string' ? s.theme : 'midnight'
    delete s.fontSize
    return { ...s, uiScale, theme }
}

// v2 (4 temas Daggerheart) → v3 (parchment/dungeon). Exportada para tests.
export function migrateSettingsV2toV3(state: unknown): unknown {
    const s = (state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}) as Record<string, unknown>
    const map: Record<string, Theme> = { daylight: 'parchment', midnight: 'dungeon', ember: 'dungeon', slate: 'dungeon' }
    return { ...s, theme: map[s.theme as string] ?? 'parchment' }
}

// v3 → v4: añade srdVersion. Exportada para tests.
export function migrateSettingsV3toV4(state: unknown): unknown {
    const s = (state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}) as Record<string, unknown>
    return { ...s, srdVersion: typeof s.srdVersion === 'string' ? s.srdVersion : 'srd-2024' }
}

interface SettingsState {
    uiScale: number
    setUiScale: (scale: number) => void
    theme: Theme
    setTheme: (theme: Theme) => void
    vaultPath: string | null
    setVaultPath: (path: string | null) => void
    playerWidgetCollapsed: boolean
    setPlayerWidgetCollapsed: (v: boolean) => void
    language: Lang
    setLanguage: (language: Lang) => void
    pinnedRules: string[]
    togglePinnedRule: (key: string) => void
    srdVersion: string
    setSrdVersion: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            uiScale: 1.0,
            setUiScale: (uiScale) => set({ uiScale }),
            theme: 'parchment',
            setTheme: (theme) => set({ theme }),
            vaultPath: null,
            setVaultPath: (vaultPath) => set({ vaultPath }),
            playerWidgetCollapsed: false,
            setPlayerWidgetCollapsed: (playerWidgetCollapsed) => set({ playerWidgetCollapsed }),
            language: 'en',
            setLanguage: (language) => set({ language }),
            pinnedRules: [],
            togglePinnedRule: (key) => set((s) => ({
                pinnedRules: s.pinnedRules.includes(key)
                    ? s.pinnedRules.filter((k) => k !== key)
                    : [...s.pinnedRules, key],
            })),
            srdVersion: 'srd-2024',
            setSrdVersion: (srdVersion) => set({ srdVersion }),
        }),
        {
            name: 'dnd-settings',
            version: 4,
            migrate: createMigrate<SettingsState>(4, { 2: migrateSettingsV1toV2, 3: migrateSettingsV2toV3, 4: migrateSettingsV3toV4 }),
            storage: createJSONStorage(() => electronStorage),
        }
    )
)

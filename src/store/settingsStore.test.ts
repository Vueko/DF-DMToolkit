import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSettingsStore, detectDefaultLanguage, migrateSettingsV1toV2, migrateSettingsV2toV3, migrateSettingsV3toV4 } from './settingsStore'

beforeEach(() => useSettingsStore.setState({ uiScale: 1.0, theme: 'parchment', vaultPath: null, playerWidgetCollapsed: false, language: 'en', srdVersion: 'srd-2024' }))

describe('settingsStore', () => {
    it('setUiScale', () => {
        useSettingsStore.getState().setUiScale(1.25)
        expect(useSettingsStore.getState().uiScale).toBe(1.25)
    })
    it('setTheme', () => {
        useSettingsStore.getState().setTheme('dungeon')
        expect(useSettingsStore.getState().theme).toBe('dungeon')
    })
    it('setVaultPath', () => {
        useSettingsStore.getState().setVaultPath('C:/vault')
        expect(useSettingsStore.getState().vaultPath).toBe('C:/vault')
    })
    it('setPlayerWidgetCollapsed', () => {
        useSettingsStore.getState().setPlayerWidgetCollapsed(true)
        expect(useSettingsStore.getState().playerWidgetCollapsed).toBe(true)
    })
    it('setLanguage', () => {
        useSettingsStore.getState().setLanguage('es')
        expect(useSettingsStore.getState().language).toBe('es')
    })
})

describe('detectDefaultLanguage', () => {
    // No usar unstubAllGlobals: borraría el stub de `window` del setup global.
    const originalNavigator = globalThis.navigator
    afterEach(() => vi.stubGlobal('navigator', originalNavigator))
    it('es-* → es', () => {
        vi.stubGlobal('navigator', { language: 'es-MX' })
        expect(detectDefaultLanguage()).toBe('es')
    })
    it('otros → en', () => {
        vi.stubGlobal('navigator', { language: 'en-US' })
        expect(detectDefaultLanguage()).toBe('en')
        vi.stubGlobal('navigator', { language: 'fr-FR' })
        expect(detectDefaultLanguage()).toBe('en')
    })
    it('sin navigator → en', () => {
        vi.stubGlobal('navigator', undefined)
        expect(detectDefaultLanguage()).toBe('en')
    })
})

describe('migrateSettingsV1toV2', () => {
    it('maps fontSize to uiScale and keeps vaultPath', () => {
        const out = migrateSettingsV1toV2({ fontSize: 'lg', vaultPath: 'C:/v' }) as Record<string, unknown>
        expect(out.uiScale).toBe(1.1)
        expect(out.vaultPath).toBe('C:/v')
        expect(out.theme).toBe('midnight')
        expect('fontSize' in out).toBe(false)
    })
    it('defaults unknown fontSize to 1.0', () => {
        expect((migrateSettingsV1toV2({ fontSize: 'xx' }) as Record<string, unknown>).uiScale).toBe(1.0)
    })
    it('handles undefined state', () => {
        expect((migrateSettingsV1toV2(undefined) as Record<string, unknown>).uiScale).toBe(1.0)
    })
})

describe('migrateSettingsV2toV3', () => {
    it('mapea los temas viejos a parchment/dungeon', () => {
        expect((migrateSettingsV2toV3({ theme: 'daylight' }) as { theme: string }).theme).toBe('parchment')
        expect((migrateSettingsV2toV3({ theme: 'midnight' }) as { theme: string }).theme).toBe('dungeon')
        expect((migrateSettingsV2toV3({ theme: 'ember' }) as { theme: string }).theme).toBe('dungeon')
        expect((migrateSettingsV2toV3({ theme: 'slate' }) as { theme: string }).theme).toBe('dungeon')
    })
    it('desconocido o ausente → parchment y conserva el resto', () => {
        const out = migrateSettingsV2toV3({ theme: 'wat', uiScale: 1.1 }) as { theme: string; uiScale: number }
        expect(out.theme).toBe('parchment')
        expect(out.uiScale).toBe(1.1)
        expect((migrateSettingsV2toV3({}) as { theme: string }).theme).toBe('parchment')
    })
})

describe('migrateSettingsV3toV4', () => {
    it('añade srdVersion por defecto y conserva el resto', () => {
        const out = migrateSettingsV3toV4({ theme: 'parchment', uiScale: 1.1 }) as Record<string, unknown>
        expect(out.srdVersion).toBe('srd-2024')
        expect(out.theme).toBe('parchment')
        expect(out.uiScale).toBe(1.1)
    })
    it('respeta un srdVersion ya presente', () => {
        expect((migrateSettingsV3toV4({ srdVersion: 'srd' }) as Record<string, unknown>).srdVersion).toBe('srd')
    })
})

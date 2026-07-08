import type { Campaign } from '../types'

export const APP_ID = 'dnd5e-toolkit'
export const FORMAT_VERSION = 1
export const FULL_STORE_KEYS = [
    'dnd-campaigns', 'dnd-bestiary', 'dnd-homebrew', 'dnd-party', 'dnd-combat', 'dnd-music', 'dnd-soundboard', 'dnd-settings',
] as const

export interface FullEnvelope {
    app: typeof APP_ID
    kind: 'full'
    formatVersion: number
    exportedAt: string
    data: Record<string, string>
}

export type ParsedImport =
    | { kind: 'full'; data: Record<string, unknown>; legacy: boolean }
    | { kind: 'invalid'; reason: string }

// --- construcción ---

function stripVaultPath(settingsBlob: string): string {
    try {
        const parsed = JSON.parse(settingsBlob) as { state?: unknown; version?: number }
        if (parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object') {
            const state = { ...(parsed.state as Record<string, unknown>) }
            delete state.vaultPath
            return JSON.stringify({ ...parsed, state })
        }
        return settingsBlob
    } catch {
        return settingsBlob
    }
}

export function buildFullExport(
    blobs: Record<string, string | null>,
    exportedAt: string = new Date().toISOString(),
): FullEnvelope {
    const data: Record<string, string> = {}
    for (const key of FULL_STORE_KEYS) {
        const blob = blobs[key]
        if (blob == null) continue
        data[key] = key === 'dnd-settings' ? stripVaultPath(blob) : blob
    }
    return { app: APP_ID, kind: 'full', formatVersion: FORMAT_VERSION, exportedAt, data }
}

// --- parseo + validación ---

export function parseImport(raw: string): ParsedImport {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return { kind: 'invalid', reason: 'JSON malformado.' }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { kind: 'invalid', reason: 'Formato no reconocido.' }
    }

    const obj = parsed as Record<string, unknown>

    if (obj.app === APP_ID && obj.kind === 'full') {
        const version = obj.formatVersion
        if (typeof version !== 'number' || version > FORMAT_VERSION) {
            return { kind: 'invalid', reason: 'Backup de una versión más nueva; actualiza la app.' }
        }
        if (!obj.data || typeof obj.data !== 'object') return { kind: 'invalid', reason: 'Backup sin datos.' }
        return { kind: 'full', data: obj.data as Record<string, unknown>, legacy: false }
    }

    // Backup plano antiguo (sin sobre): alguna key conocida a nivel raíz.
    if (FULL_STORE_KEYS.some((k) => k in obj)) {
        const data: Record<string, unknown> = {}
        for (const k of FULL_STORE_KEYS) if (k in obj) data[k] = obj[k]
        return { kind: 'full', data, legacy: true }
    }

    return { kind: 'invalid', reason: 'Formato no reconocido.' }
}

// --- fusiones (puras) ---

export function mergeCampaignsById(existing: Campaign[], incoming: Campaign[]): Campaign[] {
    const ids = new Set(existing.map((c) => c.id))
    return [...existing, ...incoming.filter((c) => !ids.has(c.id))]
}

// Fusiona el blob persistido de campañas (string `{state,version}`): añade las campañas
// entrantes cuyo id no exista y conserva las referencias activas actuales.
export function mergeCampaignBlobs(currentBlob: string | null, incomingBlob: string): string {
    let incoming: { state?: Record<string, unknown>; version?: number }
    try {
        incoming = JSON.parse(incomingBlob)
    } catch {
        return incomingBlob
    }
    let current: { state?: Record<string, unknown> } | null = null
    if (currentBlob != null) {
        try { current = JSON.parse(currentBlob) } catch { current = null }
    }
    const existingCampaigns = (current?.state?.campaigns as Campaign[] | undefined) ?? []
    const incomingCampaigns = (incoming?.state?.campaigns as Campaign[] | undefined) ?? []
    const mergedState = {
        ...(incoming.state ?? {}),
        campaigns: mergeCampaignsById(existingCampaigns, incomingCampaigns),
        currentCampaignId: (current?.state?.currentCampaignId as string | null | undefined) ?? null,
        currentSessionId: (current?.state?.currentSessionId as string | null | undefined) ?? null,
    }
    return JSON.stringify({ ...incoming, state: mergedState })
}

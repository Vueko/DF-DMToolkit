export const SRD_RESOURCES = ['creatures', 'conditions', 'rules', 'rulesets', 'spells', 'magicitems'] as const
export type SrdResource = (typeof SRD_RESOURCES)[number]

export type SrdResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string }

export interface SrdVersion {
    id: string
    label: string
    documentKey: string
    pdfUrl: string
}

export interface SrdCacheStatus {
    resource: SrdResource
    cached: boolean
    items: number | null
    updatedAt: string | null
}

export interface SrdPrefetchProgress {
    resource: SrdResource
    index: number   // 1-based
    total: number
    state: 'downloading' | 'done' | 'error'
    items?: number
    error?: string
}

export interface SrdPrefetchSummary {
    ok: boolean
    items: Partial<Record<SrdResource, number>>
    errors: Partial<Record<SrdResource, string>>
}

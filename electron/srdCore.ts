import { join, dirname } from 'path'
import * as fs from 'fs'

// Mismo patrón de validación que el vault en main.ts.
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/

export const SRD_RESOURCES = ['creatures', 'conditions', 'rules', 'rulesets', 'spells', 'magicitems'] as const
export type SrdResource = (typeof SRD_RESOURCES)[number]

const API_ORIGIN = 'https://api.open5e.com/'
const API_BASE = `${API_ORIGIN}v2/`
const PAGE_LIMIT = 100
const MAX_PAGES = 200
const FETCH_TIMEOUT_MS = 30_000

export interface SrdVersion { id: string; label: string; documentKey: string; pdfUrl: string }

export const SRD_VERSIONS: readonly SrdVersion[] = [
    {
        id: 'srd-2024',
        label: 'SRD 5.2.1',
        documentKey: 'srd-2024',
        pdfUrl: 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
    },
]

export const DEFAULT_SRD_VERSION = 'srd-2024'

export function versionById(id: string): SrdVersion {
    return SRD_VERSIONS.find((v) => v.id === id)
        ?? SRD_VERSIONS.find((v) => v.id === DEFAULT_SRD_VERSION)!
}

export function isSrdResource(r: unknown): r is SrdResource {
    return typeof r === 'string' && (SRD_RESOURCES as readonly string[]).includes(r)
}

export function isValidKey(k: unknown): k is string {
    return typeof k === 'string' && SAFE_ID_RE.test(k)
}

export function listUrl(resource: SrdResource, documentKey: string): string {
    return `${API_BASE}${resource}/?format=json&document__key=${documentKey}&limit=${PAGE_LIMIT}`
}

export function itemUrl(resource: SrdResource, key: string): string {
    return `${API_BASE}${resource}/${key}/?format=json`
}

export type FetchJson = (url: string) => Promise<unknown>

export const defaultFetchJson: FetchJson = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`)
    return res.json()
}

interface DrfPageShape { next?: unknown; results?: unknown }

// Ensambla un listado DRF paginado. Solo sigue `next` dentro de api.open5e.com.
export async function fetchAllPages(fetchJson: FetchJson, firstUrl: string): Promise<unknown[]> {
    const results: unknown[] = []
    let url: string | null = firstUrl
    for (let pages = 0; url && pages < MAX_PAGES; pages++) {
        const data = (await fetchJson(url)) as DrfPageShape
        if (!data || !Array.isArray(data.results)) throw new Error(`Respuesta inesperada de ${url}`)
        results.push(...data.results)
        url = typeof data.next === 'string' && data.next.startsWith(API_ORIGIN) ? data.next : null
    }
    return results
}

export interface SrdCacheStatusEntry {
    resource: SrdResource
    cached: boolean
    items: number | null
    updatedAt: string | null
}

interface ListEnvelope { updatedAt: string; results: unknown[] }

export class SrdCache {
    constructor(
        private readonly baseDir: string,
        private readonly documentKey: string,
        private readonly fetchJson: FetchJson = defaultFetchJson,
    ) {}

    private listFile(resource: SrdResource): string {
        return join(this.baseDir, this.documentKey, resource, '_list.json')
    }

    private itemFile(resource: SrdResource, key: string): string {
        return join(this.baseDir, this.documentKey, resource, `${key}.json`)
    }

    private readJson(file: string): unknown | null {
        try {
            if (!fs.existsSync(file)) return null
            return JSON.parse(fs.readFileSync(file, 'utf-8'))
        } catch {
            return null // caché corrupta: tratar como miss
        }
    }

    private writeJson(file: string, value: unknown): void {
        fs.mkdirSync(dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(value))
    }

    async getList(resource: SrdResource, opts: { refresh?: boolean } = {}): Promise<unknown[]> {
        if (!opts.refresh) {
            const cached = this.readJson(this.listFile(resource)) as ListEnvelope | null
            if (cached && Array.isArray(cached.results)) return cached.results
        }
        const results = await fetchAllPages(this.fetchJson, listUrl(resource, this.documentKey))
        const envelope: ListEnvelope = { updatedAt: new Date().toISOString(), results }
        this.writeJson(this.listFile(resource), envelope)
        return results
    }

    async getItem(resource: SrdResource, key: string): Promise<unknown> {
        const cached = this.readJson(this.itemFile(resource, key))
        if (cached !== null) return cached
        const item = await this.fetchJson(itemUrl(resource, key))
        this.writeJson(this.itemFile(resource, key), item)
        return item
    }

    cacheStatus(): SrdCacheStatusEntry[] {
        return SRD_RESOURCES.map((resource) => {
            const envelope = this.readJson(this.listFile(resource)) as ListEnvelope | null
            if (!envelope || !Array.isArray(envelope.results)) {
                return { resource, cached: false, items: null, updatedAt: null }
            }
            return {
                resource,
                cached: true,
                items: envelope.results.length,
                updatedAt: typeof envelope.updatedAt === 'string' ? envelope.updatedAt : null,
            }
        })
    }

    clear(): void {
        try { fs.rmSync(join(this.baseDir, this.documentKey), { recursive: true, force: true }) } catch { /* nada que borrar */ }
    }
}

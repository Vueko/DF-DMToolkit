import { ipcMain } from 'electron'
import { SrdCache, SRD_RESOURCES, SRD_VERSIONS, isSrdResource, isValidKey, versionById } from './srdCore'
import type { SrdResource } from './srdCore'

type SrdResult = { ok: true; data: unknown } | { ok: false; error: string }

interface PrefetchProgress {
    resource: SrdResource
    index: number
    total: number
    state: 'downloading' | 'done' | 'error'
    items?: number
    error?: string
}

const msg = (e: unknown): string => (e instanceof Error ? e.message : String(e))

export function registerSrdIpc(
    cacheDir: string,
    sendProgress: (p: PrefetchProgress) => void,
): void {
    const caches = new Map<string, SrdCache>()
    const cacheFor = (version: unknown): SrdCache => {
        const documentKey = versionById(typeof version === 'string' ? version : '').documentKey
        let cache = caches.get(documentKey)
        if (!cache) { cache = new SrdCache(cacheDir, documentKey); caches.set(documentKey, cache) }
        return cache
    }

    ipcMain.handle('srd:get', async (_, resource: unknown, key?: unknown, version?: unknown): Promise<SrdResult> => {
        if (!isSrdResource(resource)) return { ok: false, error: 'Recurso SRD no permitido' }
        if (key !== undefined && !isValidKey(key)) return { ok: false, error: 'Key SRD inválida' }
        try {
            const cache = cacheFor(version)
            const data = key === undefined
                ? await cache.getList(resource)
                : await cache.getItem(resource, key)
            return { ok: true, data }
        } catch (e) {
            return { ok: false, error: msg(e) }
        }
    })

    ipcMain.handle('srd:prefetch-all', async (_, version?: unknown) => {
        const cache = cacheFor(version)
        const items: Partial<Record<SrdResource, number>> = {}
        const errors: Partial<Record<SrdResource, string>> = {}
        const total = SRD_RESOURCES.length
        for (const [i, resource] of SRD_RESOURCES.entries()) {
            sendProgress({ resource, index: i + 1, total, state: 'downloading' })
            try {
                const results = await cache.getList(resource, { refresh: true })
                items[resource] = results.length
                sendProgress({ resource, index: i + 1, total, state: 'done', items: results.length })
            } catch (e) {
                errors[resource] = msg(e)
                sendProgress({ resource, index: i + 1, total, state: 'error', error: msg(e) })
            }
        }
        return { ok: Object.keys(errors).length === 0, items, errors }
    })

    ipcMain.handle('srd:cache-status', (_, version?: unknown) => cacheFor(version).cacheStatus())
    ipcMain.handle('srd:versions', () => SRD_VERSIONS)
    ipcMain.handle('srd:clear-cache', () => { for (const v of SRD_VERSIONS) cacheFor(v.id).clear() })
}

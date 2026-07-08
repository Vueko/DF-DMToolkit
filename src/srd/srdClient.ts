import type { SrdResource, SrdResult } from '../types'

// Caché en memoria por sesión + dedupe de peticiones inflight sobre el IPC srd:get.
const memCache = new Map<string, unknown>()
const inflight = new Map<string, Promise<SrdResult>>()

const cacheKey = (resource: SrdResource, key?: string, version?: string): string =>
    `${version ?? ''}|${key ? `${resource}:${key}` : resource}`

export async function srdFetch<T = unknown>(resource: SrdResource, key?: string, version?: string): Promise<SrdResult<T>> {
    const ck = cacheKey(resource, key, version)
    if (memCache.has(ck)) return { ok: true, data: memCache.get(ck) as T }
    const pending = inflight.get(ck)
    if (pending) return pending as Promise<SrdResult<T>>

    const request = (async (): Promise<SrdResult> => {
        try {
            const res = await window.electron.srd.get(resource, key, version)
            if (res.ok) memCache.set(ck, res.data)
            return res
        } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : String(e) }
        } finally {
            inflight.delete(ck)
        }
    })()
    inflight.set(ck, request)
    return request as Promise<SrdResult<T>>
}

export function clearSrdMemCache(): void {
    memCache.clear()
}

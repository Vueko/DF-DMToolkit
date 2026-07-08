import { describe, it, expect, vi } from 'vitest'
import * as os from 'os'
import * as fs from 'fs'
import { join } from 'path'
import {
    SRD_RESOURCES, isSrdResource, isValidKey, listUrl, itemUrl,
    fetchAllPages, SrdCache, versionById,
} from './srdCore'

const page = (results: unknown[], next: string | null) => ({ count: 3, next, previous: null, results })
const tmpDir = () => fs.mkdtempSync(join(os.tmpdir(), 'srd-test-'))

describe('validación', () => {
    it('acepta solo recursos de la whitelist', () => {
        expect(isSrdResource('creatures')).toBe(true)
        expect(isSrdResource('documents')).toBe(false)
        expect(isSrdResource(null)).toBe(false)
    })
    it('valida keys con SAFE_ID_RE', () => {
        expect(isValidKey('srd-2024_goblin')).toBe(true)
        expect(isValidKey('../etc/passwd')).toBe(false)
        expect(isValidKey('a'.repeat(81))).toBe(false)
        expect(isValidKey(5)).toBe(false)
    })
})

describe('urls', () => {
    it('listUrl filtra por documentKey y pagina', () => {
        expect(listUrl('spells', 'srd-2024')).toBe('https://api.open5e.com/v2/spells/?format=json&document__key=srd-2024&limit=100')
        expect(listUrl('magicitems', 'srd')).toBe('https://api.open5e.com/v2/magicitems/?format=json&document__key=srd&limit=100')
    })
    it('itemUrl apunta al detalle', () => {
        expect(itemUrl('creatures', 'srd-2024_goblin')).toBe('https://api.open5e.com/v2/creatures/srd-2024_goblin/?format=json')
    })
})

describe('versiones', () => {
    it('versionById devuelve la versión pedida o el default', () => {
        expect(versionById('srd-2024').documentKey).toBe('srd-2024')
        expect(versionById('srd-2024').label).toBe('SRD 5.2.1')
        expect(versionById('inexistente').id).toBe('srd-2024')
    })
    it('magicitems está en la whitelist de recursos', () => {
        expect(isSrdResource('magicitems')).toBe(true)
    })
})

describe('fetchAllPages', () => {
    it('ensambla todas las páginas siguiendo next', async () => {
        const fetchJson = vi.fn()
            .mockResolvedValueOnce(page([1, 2], 'https://api.open5e.com/v2/x/?offset=2'))
            .mockResolvedValueOnce(page([3], null))
        const all = await fetchAllPages(fetchJson, 'https://api.open5e.com/v2/x/')
        expect(all).toEqual([1, 2, 3])
        expect(fetchJson).toHaveBeenCalledTimes(2)
    })
    it('no sigue un next fuera de api.open5e.com', async () => {
        const fetchJson = vi.fn().mockResolvedValueOnce(page([1], 'https://evil.example/steal'))
        const all = await fetchAllPages(fetchJson, 'https://api.open5e.com/v2/x/')
        expect(all).toEqual([1])
        expect(fetchJson).toHaveBeenCalledTimes(1)
    })
    it('lanza si la página no tiene results', async () => {
        const fetchJson = vi.fn().mockResolvedValueOnce({ nope: true })
        await expect(fetchAllPages(fetchJson, 'https://api.open5e.com/v2/x/')).rejects.toThrow()
    })
})

describe('SrdCache', () => {
    it('getList: cache-first en disco (solo un fetch para dos lecturas)', async () => {
        const fetchJson = vi.fn().mockResolvedValue(page([{ key: 'a' }], null))
        const cache = new SrdCache(tmpDir(), 'srd-2024', fetchJson)
        const first = await cache.getList('spells')
        const second = await cache.getList('spells')
        expect(first).toEqual([{ key: 'a' }])
        expect(second).toEqual([{ key: 'a' }])
        expect(fetchJson).toHaveBeenCalledTimes(1)
    })
    it('getList con refresh fuerza re-descarga', async () => {
        const fetchJson = vi.fn().mockResolvedValue(page([{ key: 'a' }], null))
        const cache = new SrdCache(tmpDir(), 'srd-2024', fetchJson)
        await cache.getList('spells')
        await cache.getList('spells', { refresh: true })
        expect(fetchJson).toHaveBeenCalledTimes(2)
    })
    it('getItem: miss → fetch + persiste; hit → sin fetch', async () => {
        const fetchJson = vi.fn().mockResolvedValue({ key: 'srd-2024_goblin', name: 'Goblin' })
        const cache = new SrdCache(tmpDir(), 'srd-2024', fetchJson)
        const item = await cache.getItem('creatures', 'srd-2024_goblin')
        const again = await cache.getItem('creatures', 'srd-2024_goblin')
        expect(item).toEqual({ key: 'srd-2024_goblin', name: 'Goblin' })
        expect(again).toEqual(item)
        expect(fetchJson).toHaveBeenCalledTimes(1)
    })
    it('cacheStatus refleja qué hay descargado', async () => {
        const fetchJson = vi.fn().mockResolvedValue(page([1, 2], null))
        const cache = new SrdCache(tmpDir(), 'srd-2024', fetchJson)
        await cache.getList('conditions')
        const status = cache.cacheStatus()
        expect(status).toHaveLength(SRD_RESOURCES.length)
        const cond = status.find((s) => s.resource === 'conditions')!
        expect(cond.cached).toBe(true)
        expect(cond.items).toBe(2)
        expect(typeof cond.updatedAt).toBe('string')
        expect(status.find((s) => s.resource === 'spells')!.cached).toBe(false)
    })
    it('clear elimina la caché', async () => {
        const fetchJson = vi.fn().mockResolvedValue(page([1], null))
        const cache = new SrdCache(tmpDir(), 'srd-2024', fetchJson)
        await cache.getList('rules')
        cache.clear()
        expect(cache.cacheStatus().every((s) => !s.cached)).toBe(true)
    })
    it('namespacea la caché por documentKey: dos versiones no colisionan', async () => {
        const dir = tmpDir()
        const a = new SrdCache(dir, 'srd-2024', vi.fn().mockResolvedValue(page([{ key: 'a' }], null)))
        const b = new SrdCache(dir, 'srd', vi.fn().mockResolvedValue(page([{ key: 'b' }], null)))
        expect(await a.getList('spells')).toEqual([{ key: 'a' }])
        expect(await b.getList('spells')).toEqual([{ key: 'b' }])
        expect(await a.getList('spells')).toEqual([{ key: 'a' }]) // relee su propia versión de disco
    })
})

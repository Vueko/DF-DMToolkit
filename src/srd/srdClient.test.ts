import { describe, it, expect, vi, beforeEach } from 'vitest'
import { srdFetch, clearSrdMemCache } from './srdClient'

// setup.ts stubbea window.electron sin `srd`; lo inyectamos aquí.
const get = vi.fn()
beforeEach(() => {
    clearSrdMemCache()
    get.mockReset()
    ;(window.electron as unknown as Record<string, unknown>).srd = { get }
})

describe('srdFetch', () => {
    it('cachea en memoria: dos llamadas → un solo IPC', async () => {
        get.mockResolvedValue({ ok: true, data: [1, 2] })
        expect(await srdFetch('spells', undefined, 'srd-2024')).toEqual({ ok: true, data: [1, 2] })
        expect(await srdFetch('spells', undefined, 'srd-2024')).toEqual({ ok: true, data: [1, 2] })
        expect(get).toHaveBeenCalledTimes(1)
        expect(get).toHaveBeenCalledWith('spells', undefined, 'srd-2024')
    })
    it('la versión forma parte de la cache key: distinta versión → nuevo IPC', async () => {
        get.mockResolvedValue({ ok: true, data: 'x' })
        await srdFetch('spells', undefined, 'srd-2024')
        await srdFetch('spells', undefined, 'srd')
        expect(get).toHaveBeenCalledTimes(2)
    })
    it('dedupe: llamadas concurrentes comparten la promesa', async () => {
        get.mockReturnValue(new Promise((r) => setTimeout(() => r({ ok: true, data: 'x' }), 10)))
        const [a, b] = await Promise.all([srdFetch('rules'), srdFetch('rules')])
        expect(a).toEqual({ ok: true, data: 'x' })
        expect(b).toEqual({ ok: true, data: 'x' })
        expect(get).toHaveBeenCalledTimes(1)
    })
    it('los errores no se cachean: el retry vuelve a llamar', async () => {
        get.mockResolvedValueOnce({ ok: false, error: 'sin red' })
            .mockResolvedValueOnce({ ok: true, data: 'ya' })
        expect(await srdFetch('conditions')).toEqual({ ok: false, error: 'sin red' })
        expect(await srdFetch('conditions')).toEqual({ ok: true, data: 'ya' })
        expect(get).toHaveBeenCalledTimes(2)
    })
    it('una key distinta es una entrada distinta', async () => {
        get.mockResolvedValue({ ok: true, data: 'g' })
        await srdFetch('creatures', 'srd-2024_goblin')
        await srdFetch('creatures')
        expect(get).toHaveBeenCalledTimes(2)
    })
    it('una excepción del IPC se convierte en error', async () => {
        get.mockRejectedValue(new Error('kaput'))
        expect(await srdFetch('spells')).toEqual({ ok: false, error: 'kaput' })
    })
})

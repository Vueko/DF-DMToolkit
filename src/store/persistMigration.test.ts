import { describe, it, expect, vi } from 'vitest'
import { applyMigrations, createMigrate } from './persistMigration'

describe('applyMigrations', () => {
    const steps = { 2: (s: unknown) => ({ x: (s as { old: number }).old }) }
    it('applies the step from v1 to v2', () => {
        expect(applyMigrations({ old: 5 }, 1, 2, steps)).toEqual({ x: 5 })
    })
    it('no-op when fromVersion === currentVersion', () => {
        expect(applyMigrations({ x: 9 }, 2, 2, steps)).toEqual({ x: 9 })
    })
    it('applies multiple steps in order', () => {
        const chain = {
            2: (s: unknown) => ({ ...(s as object), a: 1 }),
            3: (s: unknown) => ({ ...(s as object), b: 2 }),
        }
        expect(applyMigrations({ start: true }, 1, 3, chain)).toEqual({ start: true, a: 1, b: 2 })
    })
})

describe('createMigrate', () => {
    const steps = { 2: (s: unknown) => ({ x: (s as { old: number }).old }) }

    it('backs up, then returns the migrated state', async () => {
        const backup = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('window', { electron: { store: { backup } } })
        const migrate = createMigrate<{ x: number }>(2, steps)
        const result = await migrate({ old: 7 }, 1)
        expect(backup).toHaveBeenCalledTimes(1)
        expect(result).toEqual({ x: 7 })
        vi.unstubAllGlobals()
    })

    it('still migrates when the backup fails', async () => {
        const backup = vi.fn().mockRejectedValue(new Error('io'))
        vi.stubGlobal('window', { electron: { store: { backup } } })
        const migrate = createMigrate<{ x: number }>(2, steps)
        const result = await migrate({ old: 3 }, 1)
        expect(result).toEqual({ x: 3 })
        vi.unstubAllGlobals()
    })
})

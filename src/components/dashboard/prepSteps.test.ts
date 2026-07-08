import { describe, it, expect } from 'vitest'
import type { Campaign } from '../../types'
import { buildPrepSteps } from './prepSteps'

const base = (over: Partial<Campaign> = {}): Campaign => ({
    id: 'c1', name: 'C', scenes: [], sessions: [], playlists: [], ...over,
})

const done = (steps: ReturnType<typeof buildPrepSteps>, id: string) => steps.find((s) => s.id === id)!.done

describe('buildPrepSteps', () => {
    it('todo pendiente cuando no hay campaña ni vault', () => {
        const steps = buildPrepSteps(null, null)
        expect(steps.map((s) => s.id)).toEqual(['campaign', 'session', 'vault', 'scenes'])
        expect(steps.every((s) => !s.done)).toBe(true)
    })
    it('marca campaign cuando hay campaña pero no sesión', () => {
        const steps = buildPrepSteps(base(), null)
        expect(done(steps, 'campaign')).toBe(true)
        expect(done(steps, 'session')).toBe(false)
    })
    it('marca vault cuando hay vaultPath', () => {
        expect(done(buildPrepSteps(base(), 'C:/vault'), 'vault')).toBe(true)
    })
    it('marca session y scenes según los datos', () => {
        const campaign = base({
            sessions: [{ id: 's1', name: 'S', number: 1, sceneIds: ['sc1'], encounterIds: [] }],
        })
        const steps = buildPrepSteps(campaign, null)
        expect(done(steps, 'session')).toBe(true)
        expect(done(steps, 'scenes')).toBe(true)
    })
})

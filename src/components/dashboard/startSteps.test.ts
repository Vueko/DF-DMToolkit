import { describe, it, expect } from 'vitest'
import type { Campaign, PartyMember } from '../../types'
import { buildStartSteps } from './startSteps'

const base = (over: Partial<Campaign> = {}): Campaign => ({
    id: 'c1', name: 'C', scenes: [], sessions: [], playlists: [], ...over,
})
const member = { id: 'p1', name: 'Pip' } as PartyMember

const done = (steps: { id: string; done: boolean }[], id: string) => steps.find((s) => s.id === id)!.done

describe('buildStartSteps', () => {
    it('todo pendiente sin datos, en el orden del flujo', () => {
        const { steps, optional } = buildStartSteps(null, [], null, null)
        expect(steps.map((s) => s.id)).toEqual(['campaign', 'session', 'party', 'encounter', 'scenes', 'activate'])
        expect(steps.every((s) => !s.done)).toBe(true)
        expect(optional.map((s) => s.id)).toEqual(['vault'])
        expect(optional[0].done).toBe(false)
    })
    it('marca campaign con campaña y session con sesiones', () => {
        const { steps } = buildStartSteps(base(), [], null, null)
        expect(done(steps, 'campaign')).toBe(true)
        expect(done(steps, 'session')).toBe(false)
        const withSession = base({ sessions: [{ id: 's1', name: 'S', number: 1, sceneIds: [], encounterIds: [] }] })
        expect(done(buildStartSteps(withSession, [], null, null).steps, 'session')).toBe(true)
    })
    it('marca party con miembros y encounter con encuentros', () => {
        const { steps } = buildStartSteps(base({ encounters: [{ id: 'e1' } as never] }), [member], null, null)
        expect(done(steps, 'party')).toBe(true)
        expect(done(steps, 'encounter')).toBe(true)
    })
    it('marca scenes con sceneIds y activate con sesión activa', () => {
        const campaign = base({ sessions: [{ id: 's1', name: 'S', number: 1, sceneIds: ['sc1'], encounterIds: [] }] })
        const { steps } = buildStartSteps(campaign, [], null, 's1')
        expect(done(steps, 'scenes')).toBe(true)
        expect(done(steps, 'activate')).toBe(true)
    })
    it('marca vault como opcional con vaultPath', () => {
        expect(buildStartSteps(null, [], 'C:/vault', null).optional[0].done).toBe(true)
    })
})

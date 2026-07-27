import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from '../../campaignStore'
import type { Campaign, SessionItem } from '../../../types'

const item = (over: Partial<SessionItem> = {}): SessionItem =>
    ({ id: 'i1', kind: 'clue', title: 'A clue', done: false, ...over })

const baseCampaign = (): Campaign => ({
    id: 'c1',
    name: 'C',
    scenes: [],
    sessions: [
        { id: 's1', name: 'S1', number: 1, sceneIds: [], encounterIds: [] },
        { id: 's2', name: 'S2', number: 2, sceneIds: [], encounterIds: [] },
    ],
    playlists: [],
})

const get = () => useCampaignStore.getState()

beforeEach(() => {
    useCampaignStore.setState({ campaigns: [baseCampaign()], currentCampaignId: 'c1', currentSessionId: 's1' })
})

describe('sessionItems slice', () => {
    it('addSessionItem inicializa items y añade', () => {
        get().addSessionItem('c1', 's1', item())
        const sess = get().campaigns[0].sessions[0]
        expect(sess.items).toHaveLength(1)
        expect(sess.items![0].title).toBe('A clue')
    })
    it('updateSessionItem alterna done y edita el título', () => {
        get().addSessionItem('c1', 's1', item())
        get().updateSessionItem('c1', 's1', 'i1', { done: true, title: 'Revealed' })
        const it = get().campaigns[0].sessions[0].items![0]
        expect(it.done).toBe(true)
        expect(it.title).toBe('Revealed')
    })
    it('removeSessionItem elimina', () => {
        get().addSessionItem('c1', 's1', item())
        get().removeSessionItem('c1', 's1', 'i1')
        expect(get().campaigns[0].sessions[0].items).toHaveLength(0)
    })
    it('aísla los ítems por sesión', () => {
        get().addSessionItem('c1', 's1', item({ id: 'a' }))
        get().addSessionItem('c1', 's2', item({ id: 'b' }))
        expect(get().campaigns[0].sessions[0].items!.map((i) => i.id)).toEqual(['a'])
        expect(get().campaigns[0].sessions[1].items!.map((i) => i.id)).toEqual(['b'])
    })
})

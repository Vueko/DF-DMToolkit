import { describe, it, expect, beforeEach } from 'vitest'
import { usePartyStore, partyOf } from './partyStore'
import type { PartyMember } from '../types'

const mk = (id: string, over: Partial<PartyMember> = {}): PartyMember =>
    ({ id, name: 'PC', conditions: [], ...over })

const get = () => usePartyStore.getState()
beforeEach(() => usePartyStore.setState({ membersByCampaign: {} }))

describe('partyStore', () => {
    it('partyOf devuelve referencia estable para campañas sin party (evita bucles de useSyncExternalStore)', () => {
        const s = get()
        expect(partyOf(s, 'sin-party')).toBe(partyOf(s, 'sin-party'))
        expect(partyOf(s, null)).toBe(partyOf(s, null))
        expect(partyOf(s, undefined)).toBe(partyOf(s, 'otra'))
    })
    it('addMember agrupa por campaña', () => {
        get().addMember('c1', mk('a'))
        get().addMember('c2', mk('b'))
        expect(partyOf(get(), 'c1').map((m) => m.id)).toEqual(['a'])
        expect(partyOf(get(), 'c2').map((m) => m.id)).toEqual(['b'])
        expect(partyOf(get(), 'c3')).toEqual([])
    })
    it('updateMember fusiona', () => {
        get().addMember('c1', mk('a'))
        get().updateMember('c1', 'a', { name: 'Alira', ac: 17 })
        expect(partyOf(get(), 'c1')[0]).toMatchObject({ name: 'Alira', ac: 17 })
    })
    it('removeMember elimina', () => {
        get().addMember('c1', mk('a'))
        get().removeMember('c1', 'a')
        expect(partyOf(get(), 'c1')).toEqual([])
    })
    it('decrementConditionRounds baja roundsLeft con suelo 0 y no toca las que no lo definen', () => {
        get().addMember('c1', mk('a', {
            conditions: [
                { conditionId: 'poisoned', roundsLeft: 2 },
                { conditionId: 'prone' },
                { conditionId: 'stunned', roundsLeft: 0 },
            ],
        }))
        get().decrementConditionRounds('c1')
        const conds = partyOf(get(), 'c1')[0].conditions
        expect(conds[0].roundsLeft).toBe(1)
        expect(conds[1].roundsLeft).toBeUndefined()
        expect(conds[2].roundsLeft).toBe(0)   // no se auto-elimina: queda marcada
    })
})

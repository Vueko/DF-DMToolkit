import { describe, it, expect, beforeEach } from 'vitest'
import { useBestiaryStore } from './bestiaryStore'
import type { Monster } from '../types'

const mk = (id: string): Monster => ({
    id: `hb:${id}`, source: 'homebrew', name: 'M', size: 'Medium', type: 'Beast', alignment: 'unaligned',
    ac: 10, hp: { average: 10 }, speed: '30 ft.',
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    cr: 0, xp: 10, passives: [], actions: [], bonusActions: [], reactions: [], legendaryActions: [],
})

beforeEach(() => useBestiaryStore.setState({ monsters: [] }))

describe('bestiaryStore', () => {
    it('addMonster añade', () => {
        useBestiaryStore.getState().addMonster(mk('a'))
        expect(useBestiaryStore.getState().monsters.map((m) => m.id)).toEqual(['hb:a'])
    })
    it('updateMonster fusiona cambios', () => {
        useBestiaryStore.getState().addMonster(mk('a'))
        useBestiaryStore.getState().updateMonster('hb:a', { name: 'Boss', ac: 18 })
        const m = useBestiaryStore.getState().monsters[0]
        expect(m.name).toBe('Boss')
        expect(m.ac).toBe(18)
        expect(m.speed).toBe('30 ft.')
    })
    it('removeMonster elimina', () => {
        useBestiaryStore.getState().addMonster(mk('a'))
        useBestiaryStore.getState().removeMonster('hb:a')
        expect(useBestiaryStore.getState().monsters).toEqual([])
    })
})

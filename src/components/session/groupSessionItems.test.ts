import { describe, it, expect } from 'vitest'
import { groupSessionItems } from './groupSessionItems'
import type { SessionItem } from '../../types'

const item = (kind: SessionItem['kind'], id: string): SessionItem => ({ id, kind, title: id, done: false })

describe('groupSessionItems', () => {
    it('undefined → cuatro listas vacías', () => {
        expect(groupSessionItems(undefined)).toEqual({ clues: [], loot: [], messages: [], notes: [] })
    })
    it('agrupa por kind preservando el orden de inserción', () => {
        const items = [item('clue', 'a'), item('loot', 'b'), item('clue', 'c'), item('note', 'd'), item('message', 'e')]
        const g = groupSessionItems(items)
        expect(g.clues.map((i) => i.id)).toEqual(['a', 'c'])
        expect(g.loot.map((i) => i.id)).toEqual(['b'])
        expect(g.messages.map((i) => i.id)).toEqual(['e'])
        expect(g.notes.map((i) => i.id)).toEqual(['d'])
    })
})

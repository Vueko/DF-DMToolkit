import { describe, it, expect, beforeEach } from 'vitest'
import { useSoundboardStore } from './soundboardStore'
import type { Sound } from '../types'

const snd = (id: string, categoryId: string): Sound => ({ id, name: 'S', storedId: 'st', type: 'oneshot', categoryId })

beforeEach(() => useSoundboardStore.setState({ categories: [], sounds: [], activeAmbientIds: [] }))

describe('soundboardStore', () => {
    it('addCategory assigns an incrementing order', () => {
        useSoundboardStore.getState().addCategory('Combat')
        const cats = useSoundboardStore.getState().categories
        expect(cats).toHaveLength(1)
        expect(cats[0].name).toBe('Combat')
        expect(cats[0].order).toBe(0)
    })
    it('removeCategory cascades: removes sounds in that category', () => {
        useSoundboardStore.getState().addCategory('Combat')
        const catId = useSoundboardStore.getState().categories[0].id
        useSoundboardStore.getState().addSound(snd('s1', catId))
        useSoundboardStore.getState().removeCategory(catId)
        expect(useSoundboardStore.getState().categories).toEqual([])
        expect(useSoundboardStore.getState().sounds).toEqual([])
    })
    it('removeSound cascades: removes it from activeAmbientIds', () => {
        useSoundboardStore.getState().addSound(snd('s1', 'c1'))
        useSoundboardStore.getState().setActiveAmbientIds(['s1'])
        useSoundboardStore.getState().removeSound('s1')
        expect(useSoundboardStore.getState().sounds).toEqual([])
        expect(useSoundboardStore.getState().activeAmbientIds).toEqual([])
    })
})

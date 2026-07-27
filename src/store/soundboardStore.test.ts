import { describe, it, expect, beforeEach } from 'vitest'
import { useSoundboardStore, migrateSoundboardV1toV2 } from './soundboardStore'
import type { Sound } from '../types'

const snd = (id: string, categoryId: string): Sound => ({ id, name: 'S', storedId: 'st', type: 'oneshot', categoryId })

beforeEach(() => useSoundboardStore.setState({ categories: [], sounds: [], activeAmbientIds: [], hiddenBuiltinIds: [] }))

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

describe('soundboardStore v2', () => {
    it('migración v1→v2: mood se convierte en tag y desaparece; añade hiddenBuiltinIds', () => {
        const v1 = {
            categories: [{ id: 'c1', name: 'Combat', order: 0 }],
            sounds: [
                { id: 's1', name: 'A', storedId: 'st1', type: 'oneshot', categoryId: 'c1', mood: 'tense' },
                { id: 's2', name: 'B', storedId: 'st2', type: 'ambient', categoryId: 'c1' },
            ],
        }
        const v2 = migrateSoundboardV1toV2(v1) as {
            sounds: Array<{ mood?: string; tags?: string[] }>
            hiddenBuiltinIds: string[]
        }
        expect(v2.sounds[0].tags).toEqual(['tense'])
        expect(v2.sounds[0].mood).toBeUndefined()
        expect(v2.sounds[1].tags).toBeUndefined()
        expect(v2.hiddenBuiltinIds).toEqual([])
    })
    it('migración tolera estado vacío o malformado', () => {
        expect((migrateSoundboardV1toV2({}) as { hiddenBuiltinIds: string[] }).hiddenBuiltinIds).toEqual([])
        expect((migrateSoundboardV1toV2({ sounds: undefined }) as { sounds: unknown[] }).sounds).toEqual([])
    })
    it('hideBuiltin añade una vez y limpia activeAmbientIds; unhideBuiltin revierte', () => {
        useSoundboardStore.setState({ hiddenBuiltinIds: [], activeAmbientIds: ['builtin-rain'] })
        useSoundboardStore.getState().hideBuiltin('builtin-rain')
        useSoundboardStore.getState().hideBuiltin('builtin-rain')
        expect(useSoundboardStore.getState().hiddenBuiltinIds).toEqual(['builtin-rain'])
        expect(useSoundboardStore.getState().activeAmbientIds).toEqual([])
        useSoundboardStore.getState().unhideBuiltin('builtin-rain')
        expect(useSoundboardStore.getState().hiddenBuiltinIds).toEqual([])
    })
})

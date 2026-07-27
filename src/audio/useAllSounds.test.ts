import { describe, it, expect } from 'vitest'
import { builtinToSound, visibleBuiltins } from './useAllSounds'
import { BUILTIN_SOUNDS } from './builtinSounds'

describe('useAllSounds helpers', () => {
    it('builtinToSound mapea el manifest a Sound con builtin: true y categoryId vacío', () => {
        const def = BUILTIN_SOUNDS[0]
        const s = builtinToSound(def, 'Lluvia')
        expect(s).toEqual({
            id: def.id, name: 'Lluvia', storedId: def.file, type: def.type,
            categoryId: '', icon: def.icon, tags: def.tags, builtin: true,
        })
    })
    it('visibleBuiltins excluye ocultos', () => {
        const hidden = [BUILTIN_SOUNDS[0].id]
        const visible = visibleBuiltins(hidden)
        expect(visible).toHaveLength(BUILTIN_SOUNDS.length - 1)
        expect(visible.some((b) => b.id === hidden[0])).toBe(false)
    })
})

import { describe, it, expect } from 'vitest'
import { strip5eTags } from './tags5e'

describe('strip5eTags', () => {
    it('daño y dados (toma antes del |)', () => {
        expect(strip5eTags('{@damage 1d8} y {@dice 3d6|3d6}')).toBe('1d8 y 3d6')
    })
    it('dc, hit, hit-marker', () => {
        expect(strip5eTags('{@dc 15}, {@hit 7} to hit. {@h}5 damage')).toBe('DC 15, +7 to hit. Hit: 5 damage')
    })
    it('tipos de ataque', () => {
        expect(strip5eTags('{@atk mw}')).toBe('Melee Weapon Attack:')
        expect(strip5eTags('{@atk rs}')).toBe('Ranged Spell Attack:')
    })
    it('recharge', () => {
        expect(strip5eTags('{@recharge 5}')).toBe('(Recharge 5–6)')
        expect(strip5eTags('{@recharge}')).toBe('(Recharge 6)')
    })
    it('negrita e itálica a markdown', () => {
        expect(strip5eTags('{@b Bold.} y {@i x}')).toBe('**Bold.** y *x*')
    })
    it('referencias muestran el display', () => {
        expect(strip5eTags('{@condition grappled} y {@spell fireball|PHB}')).toBe('grappled y fireball')
    })
    it('genérico y sin tags', () => {
        expect(strip5eTags('{@quux foo|bar}')).toBe('foo')
        expect(strip5eTags('texto normal')).toBe('texto normal')
    })
})

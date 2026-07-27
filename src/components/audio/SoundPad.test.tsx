import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SoundPad, { SOUND_COLORS } from './SoundPad'
import type { Sound } from '../../types'

const base: Sound = { id: 's1', name: 'Espada', storedId: 'x', type: 'oneshot', categoryId: 'c' }

describe('SoundPad', () => {
    it('renderiza nombre e icono svg', () => {
        const html = renderToStaticMarkup(<SoundPad sound={{ ...base, icon: 'sword' }} isActive={false} onPlay={() => {}} />)
        expect(html).toContain('Espada')
        expect(html).toContain('<svg')
    })
    it('ambient activo muestra el indicador de loop activo', () => {
        const amb: Sound = { ...base, type: 'ambient' }
        const active = renderToStaticMarkup(<SoundPad sound={amb} isActive={true} onPlay={() => {}} />)
        const idle = renderToStaticMarkup(<SoundPad sound={amb} isActive={false} onPlay={() => {}} />)
        expect(active).not.toBe(idle)
        expect(active).toContain('ring-2')
    })
    it('aplica clases de la paleta por color', () => {
        const html = renderToStaticMarkup(<SoundPad sound={{ ...base, color: 'ember' }} isActive={false} onPlay={() => {}} />)
        expect(html).toContain(SOUND_COLORS.ember.split(' ')[0])
    })
    it('SOUND_COLORS tiene las 5 claves', () => {
        expect(Object.keys(SOUND_COLORS).sort()).toEqual(['arcane', 'ember', 'gold', 'neutral', 'rose'])
    })
})

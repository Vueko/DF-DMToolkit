import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SOUND_ICONS, SoundIconByKey } from './soundIcons'

const EXPECTED_KEYS = [
    'rain', 'snow', 'wind', 'thunder', 'fire', 'tavern', 'forest', 'cave', 'water',
    'sword', 'magic', 'door', 'monster', 'skull', 'coins', 'arrow', 'bell', 'horn',
    'footsteps', 'music',
]

describe('SOUND_ICONS', () => {
    it('contiene todas las claves esperadas', () => {
        expect(Object.keys(SOUND_ICONS).sort()).toEqual([...EXPECTED_KEYS].sort())
    })
    it('cada icono renderiza un svg con stroke currentColor', () => {
        for (const key of EXPECTED_KEYS) {
            const Icon = SOUND_ICONS[key]
            const html = renderToStaticMarkup(<Icon />)
            expect(html, key).toContain('<svg')
            expect(html, key).toContain('stroke="currentColor"')
        }
    })
    it('SoundIconByKey cae al icono music con clave desconocida o ausente', () => {
        const fallback = renderToStaticMarkup(<SoundIconByKey icon="nope" />)
        const music = renderToStaticMarkup(<SoundIconByKey icon="music" />)
        expect(fallback).toBe(music)
        expect(renderToStaticMarkup(<SoundIconByKey />)).toBe(music)
    })
})

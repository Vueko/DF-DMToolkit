import { describe, it, expect } from 'vitest'
import { filterSounds, allTags } from './filterSounds'
import type { Sound } from '../types'

const snd = (name: string, tags?: string[]): Sound =>
    ({ id: name, name, storedId: name, type: 'oneshot', categoryId: 'c', tags })

describe('filterSounds', () => {
    const sounds = [snd('Lluvia fuerte', ['weather']), snd('Espada', ['combat']), snd('Trueno', ['weather', 'combat'])]

    it('sin query ni tags devuelve todo', () => {
        expect(filterSounds(sounds, '', [])).toHaveLength(3)
    })
    it('busca por nombre, insensible a acentos y mayúsculas', () => {
        expect(filterSounds(sounds, 'LLUVIA', []).map((s) => s.name)).toEqual(['Lluvia fuerte'])
        expect(filterSounds(sounds, 'lluvia', [])).toHaveLength(1)
        expect(filterSounds(sounds, 'única-cosa', [])).toHaveLength(0)
    })
    it('busca también en tags', () => {
        expect(filterSounds(sounds, 'combat', []).map((s) => s.name)).toEqual(['Espada', 'Trueno'])
    })
    it('filtra por tags activos (AND)', () => {
        expect(filterSounds(sounds, '', ['weather', 'combat']).map((s) => s.name)).toEqual(['Trueno'])
    })
    it('combina query + tags', () => {
        expect(filterSounds(sounds, 'true', ['weather']).map((s) => s.name)).toEqual(['Trueno'])
    })
    it('allTags devuelve únicos ordenados', () => {
        expect(allTags(sounds)).toEqual(['combat', 'weather'])
    })
})

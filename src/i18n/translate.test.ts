import { describe, it, expect } from 'vitest'
import { translate } from './translate'
import { translations } from './translations'

const dict = {
    en: { 'a.b': 'Hello {name}', 'only.en': 'EN only' },
    es: { 'a.b': 'Hola {name}' },
}

describe('translate', () => {
    it('devuelve la traducción del idioma', () => {
        expect(translate('es', 'a.b', { name: 'Ana' }, dict)).toBe('Hola Ana')
        expect(translate('en', 'a.b', { name: 'Ann' }, dict)).toBe('Hello Ann')
    })
    it('fallback a en cuando falta en es', () => {
        expect(translate('es', 'only.en', undefined, dict)).toBe('EN only')
    })
    it('clave inexistente devuelve la clave', () => {
        expect(translate('es', 'no.existe', undefined, dict)).toBe('no.existe')
    })
    it('deja {var} si no se pasa el valor', () => {
        expect(translate('en', 'a.b', {}, dict)).toBe('Hello {name}')
    })
})

describe('paridad de claves en/es', () => {
    it('en y es tienen exactamente las mismas claves', () => {
        expect(Object.keys(translations.es).sort()).toEqual(Object.keys(translations.en).sort())
    })
})

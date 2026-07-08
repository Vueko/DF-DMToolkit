import { describe, it, expect } from 'vitest'
import { unescapeMarkdown } from './markdown'

describe('unescapeMarkdown', () => {
    it('convierte \\n literal en salto de línea real', () => {
        expect(unescapeMarkdown('a\\nb')).toBe('a\nb')
    })
    it('normaliza \\r\\n y \\r a \\n', () => {
        expect(unescapeMarkdown('a\\r\\nb\\rc')).toBe('a\nb\nc')
    })
    it('convierte \\t literal en tab', () => {
        expect(unescapeMarkdown('a\\tb')).toBe('a\tb')
    })
    it('deja intacto un texto con saltos reales (idempotente para tablas GFM)', () => {
        const table = 'Intro.\n\n| A | B |\n|---|---|\n| 1 | 2 |'
        expect(unescapeMarkdown(table)).toBe(table)
    })
    it('reconstruye una tabla escapada en una tabla GFM parseable', () => {
        const escaped = 'Intro.\\n\\n| A | B |\\n|---|---|\\n| 1 | 2 |'
        expect(unescapeMarkdown(escaped)).toBe('Intro.\n\n| A | B |\n|---|---|\n| 1 | 2 |')
    })
    it('string vacío → vacío', () => {
        expect(unescapeMarkdown('')).toBe('')
    })
})

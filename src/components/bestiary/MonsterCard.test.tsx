import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MonsterCard } from './MonsterCard'
import { convert5eMonster } from '../../homebrew/mons5eToMonster'
import { adultBronzeDragonXmm, chillbornZombie } from '../../homebrew/fixtures/homebrew5e.fixture'
import type { Monster } from '../../types'

describe('MonsterCard — campos 2024', () => {
    it('muestra Initiative y el botón de sonido para monstruos 2024', () => {
        const html = renderToStaticMarkup(<MonsterCard monster={convert5eMonster(adultBronzeDragonXmm)} />)
        expect(html).toContain('Initiative')
        expect(html).toContain('+10 (20)')
        expect(html).toContain('aria-label="Play sound"')
    })
    it('no los muestra para monstruos sin esos campos', () => {
        const html = renderToStaticMarkup(<MonsterCard monster={convert5eMonster(chillbornZombie)} />)
        expect(html).not.toContain('Initiative')
        expect(html).not.toContain('aria-label="Play sound"')
    })
})

const diceMonster: Monster = {
    id: 'hb:test-wolf', source: 'homebrew', name: 'Test Wolf', size: 'Medium', type: 'Beast',
    alignment: 'unaligned', ac: 13, hp: { average: 11 }, speed: '40 ft.',
    stats: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    saves: 'Dex +4', skills: 'Perception +3, Stealth +4',
    cr: 0.25, xp: 50, passives: [], bonusActions: [], reactions: [], legendaryActions: [],
    actions: [{ id: 'a1', name: 'Bite', description: 'Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.' }],
}

describe('MonsterCard dice integration', () => {
    it('acciones renderizan spans clicables para ataque y daño', () => {
        const html = renderToStaticMarkup(<MonsterCard monster={diceMonster} />)
        expect(html).toContain('Attack Roll: +4')
        expect(html).toContain('(1d6 + 2)')
        expect(html).toContain('decoration-dotted')
    })
    it('saves y skills renderizan chips clicables', () => {
        const html = renderToStaticMarkup(<MonsterCard monster={diceMonster} />)
        expect(html).toContain('Stealth')
        // los pares parseados son botones, no texto plano
        expect((html.match(/decoration-dotted/g) ?? []).length).toBeGreaterThanOrEqual(4)
    })
})

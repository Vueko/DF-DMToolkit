import { describe, it, expect } from 'vitest'
import { asRulesets, flattenRules, searchRules } from './rules'

const data = [
    {
        key: 'rs-combat', name: 'Combat', desc: '', rules: [
            { key: 'r-order', name: 'The Order of Combat', desc: 'Rounds and turns.', index: 0 },
            { key: 'r-cover', name: 'Cover', desc: 'Half cover grants +2 AC.', index: 1 },
        ],
    },
    {
        key: 'rs-death', name: 'Damage', desc: '', rules: [
            { key: 'r-death', name: 'Death Saving Throws', desc: 'Roll a d20. Cover story.', index: 0 },
        ],
    },
    { key: 'broken', name: 'Broken' },   // sin rules → tolerado
]

describe('asRulesets', () => {
    it('castea defensivamente y normaliza rules ausentes', () => {
        const rs = asRulesets(data)
        expect(rs).toHaveLength(3)
        expect(rs[2].rules).toEqual([])
    })
    it('null → []', () => {
        expect(asRulesets(null)).toEqual([])
    })
})

describe('flattenRules', () => {
    it('aplana en orden', () => {
        expect(flattenRules(asRulesets(data)).map((r) => r.key)).toEqual(['r-order', 'r-cover', 'r-death'])
    })
})

describe('searchRules', () => {
    const rs = asRulesets(data)
    it('query corta → []', () => {
        expect(searchRules(rs, 'c')).toEqual([])
    })
    it('prioriza match de nombre sobre match de desc', () => {
        const results = searchRules(rs, 'cover')
        expect(results[0].key).toBe('r-cover')          // nombre
        expect(results.map((r) => r.key)).toContain('r-death') // desc ("Cover story")
    })
    it('respeta el límite', () => {
        expect(searchRules(rs, 'o', 1)).toEqual([])     // < 2 chars
        expect(searchRules(rs, 'cover', 1)).toHaveLength(1)
    })
})

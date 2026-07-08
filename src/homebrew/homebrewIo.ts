import type { Monster, HomebrewCollection, Spell, MagicItem } from '../types'
import { convert5eMonster, monsterTo5e } from './mons5eToMonster'
import { convert5eSpell, spellTo5e } from './spell5eToSpell'
import { convert5eItem, itemTo5e } from './item5eToItem'

export const NATIVE_APP_ID = 'dnd5e-toolkit'

export type ImportKind = '5etools' | 'native' | 'invalid'

export function detectImport(parsed: unknown): { kind: ImportKind } {
    if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' }
    const o = parsed as Record<string, unknown>
    if (o.app === NATIVE_APP_ID && o.kind === 'homebrew'
        && (Array.isArray(o.monsters) || Array.isArray(o.spells) || Array.isArray(o.items))) {
        return { kind: 'native' }
    }
    if (Array.isArray(o.monster) || Array.isArray(o.spell) || Array.isArray(o.item)) return { kind: '5etools' }
    return { kind: 'invalid' }
}

interface Source5e { full?: string; name?: string; json?: string; abbreviation?: string; authors?: string[] }

function collectionFrom5e(parsed: Record<string, unknown>, makeId: () => string): HomebrewCollection {
    const meta = parsed._meta as { sources?: Source5e[] } | undefined
    const src = meta?.sources?.[0] ?? {}
    const name = src.full ?? src.name ?? 'Homebrew'
    return {
        id: makeId(),
        name,
        source: src.json ?? src.abbreviation ?? name,
        ...(src.authors?.length ? { authors: src.authors } : {}),
        enabled: true,
        addedAt: new Date().toISOString(),
    }
}

export interface ImportResult {
    collection: HomebrewCollection
    monsters: Monster[]
    spells: Spell[]
    items: MagicItem[]
}

export function import5eCollection(parsed: unknown, makeId: () => string): ImportResult {
    const o = (parsed ?? {}) as Record<string, unknown>
    const collection = collectionFrom5e(o, makeId)
    const monsters: Monster[] = (Array.isArray(o.monster) ? o.monster : []).map((raw) => ({
        ...convert5eMonster(raw), id: makeId(), collectionId: collection.id,
    }))
    const spells: Spell[] = (Array.isArray(o.spell) ? o.spell : []).map((raw) => ({
        ...convert5eSpell(raw), key: `hb:${makeId()}`, collectionId: collection.id,
    }))
    const items: MagicItem[] = (Array.isArray(o.item) ? o.item : []).map((raw) => ({
        ...convert5eItem(raw), key: `hb:${makeId()}`, collectionId: collection.id,
    }))
    return { collection, monsters, spells, items }
}

export function importNativeCollection(parsed: unknown, makeId: () => string): ImportResult {
    const o = (parsed ?? {}) as { collection?: Partial<HomebrewCollection>; monsters?: Monster[]; spells?: Spell[]; items?: MagicItem[] }
    const collection: HomebrewCollection = {
        id: makeId(),
        name: o.collection?.name ?? 'Homebrew',
        source: o.collection?.source ?? 'HB',
        ...(o.collection?.authors?.length ? { authors: o.collection.authors } : {}),
        enabled: true,
        addedAt: new Date().toISOString(),
    }
    const monsters: Monster[] = (o.monsters ?? []).map((m) => ({ ...m, id: makeId(), source: 'homebrew' as const, collectionId: collection.id }))
    const spells: Spell[] = (o.spells ?? []).map((s) => ({ ...s, key: `hb:${makeId()}`, source: 'homebrew' as const, collectionId: collection.id }))
    const items: MagicItem[] = (o.items ?? []).map((i) => ({ ...i, key: `hb:${makeId()}`, source: 'homebrew' as const, collectionId: collection.id }))
    return { collection, monsters, spells, items }
}

export function buildNativeExport(monsters: Monster[], spells: Spell[], items: MagicItem[], collection?: HomebrewCollection): object {
    return {
        app: NATIVE_APP_ID,
        kind: 'homebrew',
        ...(collection ? { collection: { name: collection.name, source: collection.source, authors: collection.authors } } : {}),
        monsters,
        spells,
        items,
    }
}

export function build5eExport(monsters: Monster[], spells: Spell[], items: MagicItem[], collection?: HomebrewCollection): object {
    return {
        _meta: {
            sources: [{
                json: collection?.source ?? 'HOMEBREW',
                full: collection?.name ?? 'Homebrew Export',
                ...(collection?.authors?.length ? { authors: collection.authors } : {}),
            }],
        },
        monster: monsters.map(monsterTo5e),
        spell: spells.map(spellTo5e),
        item: items.map(itemTo5e),
    }
}

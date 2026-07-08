import { useBestiaryStore } from '../store/bestiaryStore'
import { useHomebrewStore } from '../store/homebrewStore'
import { useT } from '../i18n'
import {
    detectImport, import5eCollection, importNativeCollection,
    buildNativeExport, build5eExport, type ImportResult,
} from './homebrewIo'

export function useHomebrewIo() {
    const t = useT()
    const collections = useHomebrewStore((s) => s.collections)
    const monsters = useBestiaryStore((s) => s.monsters)
    const spells = useHomebrewStore((s) => s.spells)
    const items = useHomebrewStore((s) => s.items)

    const collectionCount = (id: string | undefined) =>
        monsters.filter((m) => m.collectionId === id).length
        + spells.filter((s) => s.collectionId === id).length
        + items.filter((i) => i.collectionId === id).length

    const ingest = (r: ImportResult) => {
        useHomebrewStore.getState().addCollection(r.collection)
        useBestiaryStore.getState().addMonsters(r.monsters)
        useHomebrewStore.getState().addSpells(r.spells)
        useHomebrewStore.getState().addItems(r.items)
        alert(t('bestiary.importedSummary', {
            name: r.collection.name, monsters: r.monsters.length, spells: r.spells.length, items: r.items.length,
        }))
    }

    const importFile = async () => {
        const res = await window.electron.dialog.openJson({ filters: [{ name: 'JSON', extensions: ['json'] }] })
        if (res.canceled || !res.content) return
        let parsed: unknown
        try { parsed = JSON.parse(res.content) } catch { alert(t('bestiary.importInvalid')); return }
        const { kind } = detectImport(parsed)
        const makeId = () => crypto.randomUUID()
        if (kind === '5etools') ingest(import5eCollection(parsed, makeId))
        else if (kind === 'native') ingest(importNativeCollection(parsed, makeId))
        else alert(t('bestiary.importInvalid'))
    }

    const exportScope = async (scope: 'all' | string, format: 'native' | '5e') => {
        const collection = scope === 'all' ? undefined : collections.find((c) => c.id === scope)
        const m = scope === 'all' ? monsters : monsters.filter((x) => x.collectionId === scope)
        const sp = scope === 'all' ? spells : spells.filter((x) => x.collectionId === scope)
        const it = scope === 'all' ? items : items.filter((x) => x.collectionId === scope)
        const env = format === 'native' ? buildNativeExport(m, sp, it, collection) : build5eExport(m, sp, it, collection)
        const slug = collection ? collection.source.toLowerCase().replace(/\W+/g, '-') : 'all'
        await window.electron.dialog.saveJson(JSON.stringify(env, null, 2), {
            defaultPath: `homebrew-${slug}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        })
    }

    const deleteCollection = (id: string) => {
        useHomebrewStore.getState().removeCollection(id)
        useBestiaryStore.getState().removeByCollection(id)
    }

    return { t, collections, collectionCount, importFile, exportScope, deleteCollection }
}

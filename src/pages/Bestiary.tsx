import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Monster } from '../types'
import { useSrd } from '../srd/useSrd'
import { open5eCreatureToMonster } from '../srd/open5eCreatureToMonster'
import { useBestiaryStore } from '../store/bestiaryStore'
import { collectionEnabled } from '../store/homebrewStore'
import { useHomebrewIo } from '../homebrew/useHomebrewIo'
import { ExportMenu, CollectionManagerList } from '../components/bestiary/HomebrewControls'
import { MonsterCard } from '../components/bestiary/MonsterCard'
import { MonsterTile } from '../components/bestiary/MonsterTile'
import { MonsterEditor } from '../components/bestiary/MonsterEditor'
import { crLabel } from '../utils/monster'
import { Button, Input, Select, Spinner } from '../components/ui'
import { useT } from '../i18n'

const COLS = 3

const blankMonster = (): Monster => ({
    id: `hb:${crypto.randomUUID()}`,
    source: 'homebrew',
    name: '',
    size: 'Medium',
    type: 'Humanoid',
    alignment: 'unaligned',
    ac: 10,
    hp: { average: 10, formula: '3d6' },
    speed: '30 ft.',
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    cr: 0,
    xp: 10,
    passives: [], actions: [], bonusActions: [], reactions: [], legendaryActions: [],
})

function Bestiary() {
    const t = useT()
    const { data, loading, error, retry } = useSrd<unknown[]>('creatures')
    const homebrew = useBestiaryStore((s) => s.monsters)
    const { addMonster, updateMonster, removeMonster } = useBestiaryStore()
    const { collections, collectionCount, importFile, exportScope, deleteCollection } = useHomebrewIo()

    const [search, setSearch] = useState('')
    const [crFilter, setCrFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [collectionFilter, setCollectionFilter] = useState('all')
    const [showCollections, setShowCollections] = useState(false)
    const [viewing, setViewing] = useState<Monster | null>(null)
    const [editing, setEditing] = useState<Monster | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const srdMonsters = useMemo(() => (data ?? []).map(open5eCreatureToMonster), [data])
    const all = useMemo(
        () => [...homebrew, ...srdMonsters].sort((a, b) => a.name.localeCompare(b.name)),
        [homebrew, srdMonsters],
    )

    const handleDeleteCollection = (id: string) => {
        deleteCollection(id)
        if (collectionFilter === id) setCollectionFilter('all')
    }

    const crOptions = useMemo(() => [...new Set(all.map((m) => m.cr))].sort((a, b) => a - b), [all])
    const typeOptions = useMemo(
        () => [...new Set(all.map((m) => m.type).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [all],
    )

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return all.filter((m) => {
            if (q && !m.name.toLowerCase().includes(q)) return false
            if (crFilter !== 'all' && String(m.cr) !== crFilter) return false
            if (typeFilter !== 'all' && m.type !== typeFilter) return false
            if (sourceFilter !== 'all' && m.source !== sourceFilter) return false
            if (m.source === 'homebrew') {
                if (!collectionEnabled({ collections }, m.collectionId)) return false
                if (collectionFilter === 'mine' && m.collectionId) return false
                else if (collectionFilter !== 'all' && collectionFilter !== 'mine' && m.collectionId !== collectionFilter) return false
            } else if (collectionFilter !== 'all') {
                return false
            }
            return true
        })
    }, [all, search, crFilter, typeFilter, sourceFilter, collectionFilter, collections])

    const scrollRef = useRef<HTMLDivElement>(null)
    const rowCount = Math.ceil(filtered.length / COLS)
    // TanStack Virtual returns imperative helpers that React Compiler cannot memoize safely.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 150,
        overscan: 6,
        measureElement: (el) => el.getBoundingClientRect().height,
    })

    const handleDuplicate = (m: Monster) => {
        const copy: Monster = {
            ...structuredClone(m),
            id: `hb:${crypto.randomUUID()}`,
            source: 'homebrew',
            name: `${m.name} ${t('bestiary.copySuffix')}`,
        }
        setViewing(null)
        setEditing(copy)
        setIsCreating(true)
    }

    const handleSave = (m: Monster) => {
        if (isCreating) addMonster(m)
        else updateMonster(m.id, m)
        setEditing(null)
        setIsCreating(false)
    }

    const handleDelete = (m: Monster) => {
        removeMonster(m.id)
        setViewing(null)
    }

    return (
        <div className="flex flex-col gap-3 h-full">

            {/* Cabecera + filtros */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">{t('bestiary.title')}</h1>
                    <p className="text-ui-muted text-sm">
                        {t(filtered.length === 1 ? 'bestiary.countOne' : 'bestiary.countOther', { count: filtered.length })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={importFile}>{t('bestiary.import')}</Button>
                    <ExportMenu collections={collections} onExport={exportScope} t={t} />
                    <Button variant="primary" onClick={() => { setEditing(blankMonster()); setIsCreating(true) }}>
                        + {t('bestiary.new')}
                    </Button>
                </div>
            </div>
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('bestiary.searchPlaceholder')}
            />
            <div className="flex gap-2">
                <Select value={crFilter} onChange={(e) => setCrFilter(e.target.value)} className="flex-1">
                    <option value="all">{t('bestiary.filterCrAll')}</option>
                    {crOptions.map((cr) => <option key={cr} value={String(cr)}>CR {crLabel(cr)}</option>)}
                </Select>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1">
                    <option value="all">{t('bestiary.filterTypeAll')}</option>
                    {typeOptions.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
                </Select>
                <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="flex-1">
                    <option value="all">{t('bestiary.filterSourceAll')}</option>
                    <option value="srd">{t('bestiary.sourceSrd')}</option>
                    <option value="homebrew">{t('bestiary.sourceHomebrew')}</option>
                </Select>
                <Select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="flex-1">
                    <option value="all">{t('bestiary.collectionAll')}</option>
                    <option value="mine">{t('bestiary.collectionMine')}</option>
                    {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>

            {collections.length > 0 && (
                <div className="bg-ui-surface border border-ui-surface2 rounded-lg">
                    <button
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-ui-text"
                        onClick={() => setShowCollections((v) => !v)}
                    >
                        <span className="font-display">{t('bestiary.collections')} ({collections.length})</span>
                        <span className="text-ui-muted">{showCollections ? '▾' : '▸'}</span>
                    </button>
                    {showCollections && (
                        <div className="border-t border-ui-surface2">
                            <CollectionManagerList
                                collections={collections}
                                collectionCount={collectionCount}
                                onDelete={handleDeleteCollection}
                                t={t}
                            />
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-danger-primary/10 border border-danger-primary/30 rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap">
                    <p className="text-danger-primary text-xs">{t('bestiary.srdError')}</p>
                    <p className="text-ui-muted text-[11px]">{t('bestiary.srdHint')}</p>
                    <Button variant="secondary" size="sm" onClick={retry}>{t('bestiary.retry')}</Button>
                </div>
            )}

            {/* Grid virtualizado de cards */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
                {loading && !error ? (
                    <div className="flex justify-center py-10"><Spinner /></div>
                ) : filtered.length === 0 ? (
                    <p className="text-ui-muted text-sm text-center py-10">{t('bestiary.empty')}</p>
                ) : (
                    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                        {virtualizer.getVirtualItems().map((row) => (
                            <div
                                key={row.index}
                                ref={virtualizer.measureElement}
                                data-index={row.index}
                                className="absolute left-0 w-full grid grid-cols-3 gap-2.5 items-start pb-2.5"
                                style={{ top: 0, transform: `translateY(${row.start}px)` }}
                            >
                                {filtered.slice(row.index * COLS, row.index * COLS + COLS).map((m) => (
                                    <MonsterTile key={m.id} monster={m} onClick={() => setViewing(m)} />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal statblock */}
            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ui-bg/80 backdrop-blur-sm" onClick={() => setViewing(null)}>
                    <div className="max-w-xl w-full max-h-[90vh] flex flex-col gap-2 modal-enter" onClick={(e) => e.stopPropagation()}>
                        <div className="overflow-y-auto">
                            <MonsterCard monster={viewing} />
                        </div>
                        <div className="flex items-center gap-2 justify-end bg-ui-surface rounded-xl border border-ui-surface2 p-2">
                            <Button variant="secondary" size="sm" onClick={() => handleDuplicate(viewing)}>
                                {t('bestiary.duplicateEdit')}
                            </Button>
                            {viewing.source === 'homebrew' && (
                                <>
                                    <Button variant="secondary" size="sm" onClick={() => { setEditing(viewing); setIsCreating(false); setViewing(null) }}>
                                        {t('bestiary.edit')}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(viewing)}>
                                        {t('bestiary.delete')}
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => setViewing(null)}>✕</Button>
                        </div>
                    </div>
                </div>
            )}

            {editing && (
                <MonsterEditor
                    initial={editing}
                    title={t(isCreating ? 'bestiary.editor.createTitle' : 'bestiary.editor.editTitle')}
                    onSave={handleSave}
                    onCancel={() => { setEditing(null); setIsCreating(false) }}
                />
            )}
        </div>
    )
}

export default Bestiary

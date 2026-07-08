import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useSrd } from '../srd/useSrd'
import { buildGlossary, searchGlossary } from '../srd/glossary'
import type { GlossaryCategory, GlossaryEntry } from '../srd/glossary'
import { getSupplement } from '../srd/supplements'
import { useSettingsStore } from '../store/settingsStore'
import { useHomebrewStore, collectionEnabled } from '../store/homebrewStore'
import { SrdVersionPicker } from '../components/SrdVersionPicker'
import { SharedMarkdown } from '../components/SharedMarkdown'
import { Button, Input, Spinner } from '../components/ui'
import { useT } from '../i18n'

const CATEGORIES: GlossaryCategory[] = ['rule', 'condition', 'spell', 'item']

function Glossary() {
    const t = useT()
    const srdVersion = useSettingsStore((s) => s.srdVersion)
    const pinnedRules = useSettingsStore((s) => s.pinnedRules)
    const togglePinnedRule = useSettingsStore((s) => s.togglePinnedRule)

    const rulesets = useSrd<unknown[]>('rulesets')
    const conditions = useSrd<unknown[]>('conditions')
    const spells = useSrd<unknown[]>('spells')
    const magicitems = useSrd<unknown[]>('magicitems')

    const hbSpells = useHomebrewStore((s) => s.spells)
    const hbItems = useHomebrewStore((s) => s.items)
    const hbCollections = useHomebrewStore((s) => s.collections)
    const enabledHbSpells = useMemo(() => hbSpells.filter((s) => collectionEnabled({ collections: hbCollections }, s.collectionId)), [hbSpells, hbCollections])
    const enabledHbItems = useMemo(() => hbItems.filter((i) => collectionEnabled({ collections: hbCollections }, i.collectionId)), [hbItems, hbCollections])

    const glossary = useMemo(() => buildGlossary({
        rulesets: rulesets.data ?? [],
        conditions: conditions.data ?? [],
        conditionsSupplement: getSupplement(srdVersion).conditions,
        rulesSupplement: getSupplement(srdVersion).rules,
        spells: spells.data ?? [],
        magicitems: magicitems.data ?? [],
        homebrewSpells: enabledHbSpells,
        homebrewItems: enabledHbItems,
    }), [rulesets.data, conditions.data, spells.data, magicitems.data, srdVersion, enabledHbSpells, enabledHbItems])

    const [category, setCategory] = useState<GlossaryCategory>('rule')
    const [query, setQuery] = useState('')
    const [selectedKey, setSelectedKey] = useState<string | null>(null)

    const allEntries = useMemo(
        () => [...glossary.rule, ...glossary.condition, ...glossary.spell, ...glossary.item],
        [glossary],
    )
    const searching = query.trim().length >= 2
    const list = useMemo(() => {
        if (searching) return searchGlossary(allEntries, query, 50)
        return [...glossary[category]].sort((a, b) => a.name.localeCompare(b.name))
    }, [searching, query, allEntries, glossary, category])

    const selected = useMemo(
        () => allEntries.find((e) => e.key === selectedKey) ?? null,
        [allEntries, selectedKey],
    )

    const loadingByCat: Record<GlossaryCategory, boolean> = {
        rule: rulesets.loading, condition: conditions.loading, spell: spells.loading, item: magicitems.loading,
    }
    const listLoading = searching ? false : loadingByCat[category]

    const scrollRef = useRef<HTMLDivElement>(null)
    // TanStack Virtual returns imperative helpers that React Compiler cannot memoize safely.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: list.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 34,
        overscan: 12,
    })

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar: versión + categorías + búsqueda + lista */}
            <div className="w-96 shrink-0 flex flex-col border-r border-ui-surface2 bg-ui-surface/30">
                <div className="px-4 pt-5 pb-3 flex flex-col gap-2 shrink-0">
                    <div>
                        <h1 className="text-ui-text font-display text-lg font-bold">{t('glossary.title')}</h1>
                        <p className="text-ui-muted text-xs">{t('glossary.subtitle')}</p>
                    </div>
                    <SrdVersionPicker />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('glossary.searchPlaceholder')} />
                    {!searching && (
                        <div className="flex gap-1">
                            {CATEGORIES.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={`flex-1 min-w-0 truncate text-center px-1.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        category === c ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                    }`}
                                >
                                    {t(`glossary.cat.${c}`)} <span className="opacity-60 tabular-nums">{glossary[c].length}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-4">
                    {listLoading ? (
                        <div className="flex justify-center py-8"><Spinner /></div>
                    ) : list.length === 0 ? (
                        <p className="text-ui-muted text-xs text-center py-6">{searching ? t('glossary.empty') : t('glossary.noData')}</p>
                    ) : (
                        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                            {virtualizer.getVirtualItems().map((row) => {
                                const entry = list[row.index]
                                return (
                                    <button
                                        key={entry.category + ':' + entry.key}
                                        onClick={() => setSelectedKey(entry.key)}
                                        className={`absolute left-0 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors truncate ${
                                            entry.key === selectedKey ? 'bg-accent/15 text-ui-text' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                                        }`}
                                        style={{ top: 0, height: row.size, transform: `translateY(${row.start}px)` }}
                                    >
                                        {searching && <span className="text-ui-muted/70 text-[10px] uppercase mr-1.5">{t(`glossary.cat.${entry.category}`)}</span>}
                                        {entry.name}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Panel de lectura */}
            <div className="flex-1 overflow-y-auto p-6">
                {selected ? (
                    <GlossaryDetail entry={selected} pinned={pinnedRules.includes(selected.key)} onTogglePin={() => togglePinnedRule(selected.key)} t={t} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-ui-muted text-sm">{t('glossary.selectPrompt')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function GlossaryDetail({ entry, pinned, onTogglePin, t }: {
    entry: GlossaryEntry
    pinned: boolean
    onTogglePin: () => void
    t: (k: string, p?: Record<string, string | number>) => string
}) {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-card-bg border border-card-border rounded-xl shadow-lg font-serif px-6 py-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 border-b border-card-border/50 pb-2">
                    <h2 className="text-2xl font-display font-black text-card-text tracking-wide">{entry.name}</h2>
                    {entry.category === 'rule' && (
                        <Button variant="secondary" size="sm" onClick={onTogglePin}>
                            {pinned ? `★ ${t('glossary.unpin')}` : `☆ ${t('glossary.pin')}`}
                        </Button>
                    )}
                </div>
                {entry.meta && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {Object.entries(entry.meta).map(([k, v]) => (
                            <span key={k} className="text-card-text/80"><span className="font-semibold text-card-text">{k}:</span> {v}</span>
                        ))}
                    </div>
                )}
                <div className="prose max-w-none overflow-x-auto">
                    <SharedMarkdown>{entry.desc}</SharedMarkdown>
                </div>
            </div>
        </div>
    )
}

export default Glossary

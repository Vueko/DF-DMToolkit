import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSrd } from '../../srd/useSrd'
import { buildGlossary, searchGlossary } from '../../srd/glossary'
import type { GlossaryEntry } from '../../srd/glossary'
import { getSupplement } from '../../srd/supplements'
import { useSettingsStore } from '../../store/settingsStore'
import { useHomebrewStore, collectionEnabled } from '../../store/homebrewStore'
import { SharedMarkdown } from '../SharedMarkdown'
import { Input } from '../ui'
import { useT } from '../../i18n'

// Consultas rápidas que cruzan categorías (regla · condición · conjuro · objeto).
const QUICK_QUERIES = ['Cover', 'Grappled', 'Fireball', 'Bag of Holding']

// Fila compacta: al hacer clic abre la entrada en un modal (no despliega dentro de la lista).
function EntryRow({ entry, pinned, canPin, onOpen, onTogglePin, t }: {
    entry: GlossaryEntry
    pinned: boolean
    canPin: boolean
    onOpen: () => void
    onTogglePin: () => void
    t: (k: string) => string
}) {
    return (
        <div className="bg-ui-bg/40 rounded-lg flex items-center gap-2 px-3 py-1.5">
            <button onClick={onOpen} className="flex-1 min-w-0 text-left text-sm text-ui-text hover:text-danger-yellow transition-colors truncate">
                {entry.name}
                <span className="text-ui-muted/60 text-[10px] uppercase ml-1.5">{t(`glossary.cat.${entry.category}`)}</span>
            </button>
            {canPin && (
                <button
                    onClick={onTogglePin}
                    className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                        pinned ? 'text-danger-gold bg-danger-gold/10 hover:bg-danger-gold/20' : 'text-ui-muted hover:text-ui-text'
                    }`}
                >
                    {pinned ? `★ ${t('glossary.unpin')}` : `☆ ${t('glossary.pin')}`}
                </button>
            )}
        </div>
    )
}

// Ficha de lectura en modal (mismo look de pergamino que la página del glosario).
function EntryModal({ entry, onClose }: { entry: GlossaryEntry; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ui-bg/80 backdrop-blur-sm" onClick={onClose}>
            <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto modal-enter" onClick={(e) => e.stopPropagation()}>
                <div className="bg-card-bg border border-card-border rounded-xl shadow-lg font-serif px-6 py-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 border-b border-card-border/50 pb-2">
                        <h2 className="text-2xl font-display font-black text-card-text tracking-wide">{entry.name}</h2>
                        <button onClick={onClose} className="text-card-text/60 hover:text-card-text text-lg leading-none">✕</button>
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
        </div>
    )
}

function RulesWidget() {
    const t = useT()
    const srdVersion = useSettingsStore((s) => s.srdVersion)
    const pinnedRules = useSettingsStore((s) => s.pinnedRules)
    const togglePinnedRule = useSettingsStore((s) => s.togglePinnedRule)

    const rulesets = useSrd<unknown[]>('rulesets')
    const conditions = useSrd<unknown[]>('conditions')
    const spells = useSrd<unknown[]>('spells')
    const magicitems = useSrd<unknown[]>('magicitems')
    const [query, setQuery] = useState('')
    const [viewing, setViewing] = useState<GlossaryEntry | null>(null)

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

    const allEntries = useMemo(
        () => [...glossary.rule, ...glossary.condition, ...glossary.spell, ...glossary.item],
        [glossary],
    )

    // Los pins solo aplican a reglas (mismo modelo que el glosario).
    const pinned = useMemo(() => {
        const byKey = new Map(glossary.rule.map((r) => [r.key, r]))
        return pinnedRules.map((k) => byKey.get(k)).filter((r): r is GlossaryEntry => !!r)
    }, [glossary.rule, pinnedRules])

    const searching = query.trim().length >= 2
    const results = useMemo(() => searchGlossary(allEntries, query, 8), [allEntries, query])
    const shown = searching ? results : pinned

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">📖 {t('glossary.title')}</h3>
                <Link to="/rules" className="text-xs text-ui-muted hover:text-ui-text underline">{t('dashboard.rulesOpen')}</Link>
            </div>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('glossary.searchPlaceholder')} />
            <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_QUERIES.map((q) => (
                    <button
                        key={q}
                        onClick={() => setQuery(q)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ui-surface2 text-ui-muted hover:text-ui-text transition-colors"
                    >
                        {q}
                    </button>
                ))}
            </div>
            {allEntries.length === 0 ? (
                <p className="text-ui-muted text-xs text-center py-3">{t('glossary.noData')}</p>
            ) : shown.length === 0 ? (
                <p className="text-ui-muted text-xs text-center py-3">
                    {searching ? t('glossary.empty') : t('dashboard.rulesPinnedEmpty')}
                </p>
            ) : (
                <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                    {shown.map((entry) => (
                        <EntryRow
                            key={entry.category + ':' + entry.key}
                            entry={entry}
                            pinned={pinnedRules.includes(entry.key)}
                            canPin={entry.category === 'rule'}
                            onOpen={() => setViewing(entry)}
                            onTogglePin={() => togglePinnedRule(entry.key)}
                            t={t}
                        />
                    ))}
                </div>
            )}
            {viewing && <EntryModal entry={viewing} onClose={() => setViewing(null)} />}
        </div>
    )
}

export default RulesWidget

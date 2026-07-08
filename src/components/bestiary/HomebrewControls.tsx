import { useState } from 'react'
import { useHomebrewStore } from '../../store/homebrewStore'
import { useHomebrewIo } from '../../homebrew/useHomebrewIo'
import type { HomebrewCollection } from '../../types'
import { Button } from '../ui'

type Tr = (k: string, params?: Record<string, string | number>) => string

function ExportRow({ label, onNative, on5e, t }: { label: string; onNative: () => void; on5e: () => void; t: Tr }) {
    return (
        <div className="flex items-center gap-2 px-1 py-1">
            <span className="flex-1 min-w-0 truncate text-ui-text">{label}</span>
            <button className="text-arcane-primary hover:underline text-xs" onClick={onNative}>{t('bestiary.exportNative')}</button>
            <button className="text-arcane-primary hover:underline text-xs" onClick={on5e}>{t('bestiary.export5e')}</button>
        </div>
    )
}

// Botón Exportar con menú de alcance (Todo / cada colección) × formato (propio / 5etools).
export function ExportMenu({ collections, onExport, t }: {
    collections: HomebrewCollection[]
    onExport: (scope: 'all' | string, format: 'native' | '5e') => void
    t: Tr
}) {
    const [open, setOpen] = useState(false)
    const pick = (scope: 'all' | string, format: 'native' | '5e') => { setOpen(false); onExport(scope, format) }
    return (
        <div className="relative">
            <Button variant="secondary" onClick={() => setOpen((v) => !v)}>{t('bestiary.export')}</Button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-ui-surface border border-ui-surface2 rounded-lg shadow-xl p-2 flex flex-col gap-1 text-sm">
                        <ExportRow label={t('bestiary.exportAll')} onNative={() => pick('all', 'native')} on5e={() => pick('all', '5e')} t={t} />
                        {collections.map((c) => (
                            <ExportRow key={c.id} label={c.name} onNative={() => pick(c.id, 'native')} on5e={() => pick(c.id, '5e')} t={t} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// Lista de colecciones: activar/desactivar, contar monstruos, borrar.
export function CollectionManagerList({ collections, collectionCount, onDelete, t }: {
    collections: HomebrewCollection[]
    collectionCount: (id: string | undefined) => number
    onDelete: (id: string) => void
    t: Tr
}) {
    return (
        <div className="divide-y divide-ui-surface2">
            {collections.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <input type="checkbox" checked={c.enabled} onChange={() => useHomebrewStore.getState().toggleCollection(c.id)} />
                    <div className="flex-1 min-w-0">
                        <p className="text-ui-text truncate">{c.name}</p>
                        <p className="text-ui-muted text-xs">{t('bestiary.collectionMonsters', { count: collectionCount(c.id) })}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(c.id)}>{t('bestiary.deleteCollection')}</Button>
                </div>
            ))}
        </div>
    )
}

// Panel completo para Settings: importar + exportar + gestor de colecciones.
export function HomebrewControls() {
    const { t, collections, collectionCount, importFile, exportScope, deleteCollection } = useHomebrewIo()
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Button variant="primary" onClick={importFile}>{t('bestiary.import')}</Button>
                <ExportMenu collections={collections} onExport={exportScope} t={t} />
            </div>
            {collections.length === 0 ? (
                <p className="text-ui-muted text-sm">{t('settings.homebrewEmpty')}</p>
            ) : (
                <div className="bg-ui-bg/40 rounded-lg border border-ui-surface2">
                    <CollectionManagerList collections={collections} collectionCount={collectionCount} onDelete={deleteCollection} t={t} />
                </div>
            )}
        </div>
    )
}

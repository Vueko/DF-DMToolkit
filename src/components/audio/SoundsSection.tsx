import { useState } from 'react'
import { useSoundboardStore } from '../../store/soundboardStore'
import { useSoundboard } from '../../context/SoundboardContext'
import { useAllSounds } from '../../audio/useAllSounds'
import { filterSounds, allTags } from '../../audio/filterSounds'
import SoundPad from './SoundPad'
import SoundEditModal from './SoundEditModal'
import { EmptyState } from '../ui'
import { useT } from '../../i18n'
import type { Sound } from '../../types'

type ModalState = { mode: 'create'; categoryId?: string } | { mode: 'edit'; sound: Sound } | null

function SoundsSection() {
    const t = useT()
    const [query, setQuery] = useState('')
    const [activeTags, setActiveTags] = useState<string[]>([])
    const [modal, setModal] = useState<ModalState>(null)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [catFeedback, setCatFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const [renamingCatId, setRenamingCatId] = useState<string | null>(null)
    const [draftCatName, setDraftCatName] = useState('')

    const allSounds = useAllSounds()
    const { categories, activeAmbientIds, hiddenBuiltinIds, addCategory, removeCategory, renameCategory, removeSound, hideBuiltin, unhideBuiltin } = useSoundboardStore()
    const { toggleAmbient, playOneshot, stopAmbient } = useSoundboard()

    const visible = filterSounds(allSounds, query, activeTags)
    const tags = allTags(allSounds)
    const isFiltering = query.trim() !== '' || activeTags.length > 0

    const handlePlay = (sound: Sound) =>
        sound.type === 'ambient' ? toggleAmbient(sound) : playOneshot(sound)

    const handleRemove = async (sound: Sound) => {
        if (sound.type === 'ambient') stopAmbient(sound.id)
        await window.electron.fs.deleteAudio(sound.storedId)
        removeSound(sound.id)
    }

    const handleHide = (sound: Sound) => {
        if (activeAmbientIds.includes(sound.id)) stopAmbient(sound.id)
        hideBuiltin(sound.id)
    }

    const handleAddCategory = () => {
        const name = newCategoryName.trim()
        if (!name) return
        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
            setCatFeedback({ type: 'error', text: t('audio.categoryExists') })
            return
        }
        addCategory(name)
        setNewCategoryName('')
        setCatFeedback({ type: 'success', text: t('audio.categoryCreated', { name }) })
    }

    const startRenameCategory = (cat: { id: string; name: string }) => {
        setDraftCatName(cat.name)
        setRenamingCatId(cat.id)
    }

    const confirmRenameCategory = () => {
        if (renamingCatId && draftCatName.trim()) renameCategory(renamingCatId, draftCatName.trim())
        setRenamingCatId(null)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') confirmRenameCategory()
        if (e.key === 'Escape') setRenamingCatId(null)
    }

    const toggleTag = (tag: string) =>
        setActiveTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]))

    const renderGroup = (label: string, sounds: Sound[], isStarter: boolean, categoryId?: string) => {
        // Starter vacío no aporta nada; y al buscar/filtrar solo se muestran grupos con resultados.
        // Las categorías del usuario, en cambio, se muestran siempre (aunque estén vacías).
        if (sounds.length === 0 && (isStarter || isFiltering)) return null
        return (
            <div key={`${label}-${categoryId ?? 'starter'}`} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 group/cat">
                    {!isStarter && categoryId && renamingCatId === categoryId ? (
                        <input
                            autoFocus
                            value={draftCatName}
                            onChange={(e) => setDraftCatName(e.target.value)}
                            onBlur={confirmRenameCategory}
                            onKeyDown={handleRenameKeyDown}
                            className="bg-transparent text-ui-muted text-[10px] font-bold uppercase tracking-wider outline-none border-b border-arcane-light"
                        />
                    ) : (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{label}</p>
                    )}
                    {isStarter && hiddenBuiltinIds.length > 0 && (
                        <button
                            onClick={() => hiddenBuiltinIds.forEach((id) => unhideBuiltin(id))}
                            className="text-[10px] text-ui-muted hover:text-ui-text transition-colors"
                        >
                            {t('audio.showHidden')} ({hiddenBuiltinIds.length})
                        </button>
                    )}
                    {!isStarter && categoryId && renamingCatId !== categoryId && (
                        <div className="flex gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                            <button onClick={() => startRenameCategory({ id: categoryId, name: label })}
                                className="text-[10px] text-ui-muted hover:text-ui-text transition-colors">{t('audio.rename')}</button>
                            <button onClick={() => setModal({ mode: 'create', categoryId })}
                                className="text-[10px] text-ui-muted hover:text-ui-text transition-colors">{t('audio.addSound')}</button>
                            <button onClick={async () => {
                                for (const s of sounds) await handleRemove(s)
                                removeCategory(categoryId)
                            }} className="text-[10px] text-red-500 hover:text-red-600 transition-colors">{t('audio.deleteCategory')}</button>
                        </div>
                    )}
                </div>
                {sounds.length === 0 ? (
                    <button
                        onClick={() => categoryId && setModal({ mode: 'create', categoryId })}
                        className="w-full text-left text-xs text-ui-muted border border-dashed border-ui-surface2 rounded-xl px-3 py-3 hover:border-arcane-light hover:text-ui-text transition-colors"
                    >
                        {t('audio.categoryEmpty')}
                    </button>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                        {sounds.map((s) => (
                            <SoundPad
                                key={s.id}
                                sound={s}
                                isActive={activeAmbientIds.includes(s.id)}
                                onPlay={() => handlePlay(s)}
                                onEdit={s.builtin ? undefined : () => setModal({ mode: 'edit', sound: s })}
                                onRemove={s.builtin ? undefined : () => handleRemove(s)}
                                onHide={s.builtin ? () => handleHide(s) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const renderZone = (title: string, type: Sound['type']) => {
        const zone = visible.filter((s) => s.type === type)
        const starter = zone.filter((s) => s.builtin)
        return (
            <section className="flex flex-col gap-4">
                <h2 className="text-sm font-display font-bold text-ui-text border-b border-ui-surface2 pb-2">{title}</h2>
                {renderGroup('Starter', starter, true)}
                {categories
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((cat) => renderGroup(cat.name, zone.filter((s) => s.categoryId === cat.id), false, cat.id))}
                {zone.length === 0 && (isFiltering || categories.length === 0) && (
                    <EmptyState size="sm" title={t('audio.zoneEmpty')} />
                )}
            </section>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 flex-wrap">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('audio.searchPlaceholder')}
                    className="bg-ui-surface border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors w-64"
                />
                <div className="flex items-center gap-1 flex-wrap">
                    {tags.map((tag) => (
                        <button key={tag} onClick={() => toggleTag(tag)}
                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border transition-colors ${
                                activeTags.includes(tag)
                                    ? 'bg-arcane-light/15 text-arcane-light border-arcane-light/40'
                                    : 'text-ui-muted border-ui-surface2 hover:text-ui-text'
                            }`}>
                            {tag}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => { setNewCategoryName(e.target.value); setCatFeedback(null) }}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            placeholder={t('audio.categoryNamePlaceholder')}
                            className="bg-ui-surface border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-1.5 text-xs text-ui-text outline-none transition-colors w-40"
                        />
                        <button onClick={handleAddCategory}
                            className="text-xs bg-ui-surface hover:bg-ui-surface2 text-ui-text border border-ui-surface2 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            {t('audio.newCategory')}
                        </button>
                        <button onClick={() => setModal({ mode: 'create' })}
                            disabled={categories.length === 0}
                            className="text-xs bg-arcane-light hover:bg-arcane-secondary text-ui-text px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                            {t('audio.addSound')}
                        </button>
                    </div>
                    {catFeedback && (
                        <p className={`text-[11px] ${catFeedback.type === 'error' ? 'text-red-500' : 'text-arcane-light'}`}>
                            {catFeedback.text}
                        </p>
                    )}
                </div>
            </div>

            {renderZone(t('audio.zoneAmbience'), 'ambient')}
            {renderZone(t('audio.zoneOneshots'), 'oneshot')}

            {modal?.mode === 'create' && (
                <SoundEditModal mode="create" categoryId={modal.categoryId} onClose={() => setModal(null)} />
            )}
            {modal?.mode === 'edit' && (
                <SoundEditModal mode="edit" sound={modal.sound} onClose={() => setModal(null)} />
            )}
        </div>
    )
}

export default SoundsSection

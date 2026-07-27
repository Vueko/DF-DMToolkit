import { useState, useRef } from 'react'
import { useSoundboardStore } from '../../store/soundboardStore'
import { generateId } from '../../utils/generateId'
import { SOUND_ICONS } from './soundIcons'
import { SOUND_COLORS } from './SoundPad'
import { useT } from '../../i18n'
import type { Sound } from '../../types'

interface SoundEditModalProps {
    mode: 'create' | 'edit'
    sound?: Sound
    categoryId?: string
    onClose: () => void
}

function SoundEditModal({ mode, sound, categoryId, onClose }: SoundEditModalProps) {
    const t = useT()
    const { categories, addSound, updateSound } = useSoundboardStore()
    const [name, setName] = useState(sound?.name ?? '')
    const [type, setType] = useState<'oneshot' | 'ambient'>(sound?.type ?? 'oneshot')
    const [catId, setCatId] = useState(sound?.categoryId ?? categoryId ?? categories[0]?.id ?? '')
    const [icon, setIcon] = useState(sound?.icon ?? '')
    const [color, setColor] = useState(sound?.color ?? '')
    const [tagsText, setTagsText] = useState((sound?.tags ?? []).join(', '))
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const parseTags = (text: string): string[] | undefined => {
        const tags = text.split(',').map((s) => s.trim()).filter(Boolean)
        return tags.length > 0 ? tags : undefined
    }

    const canSubmit = name.trim() && catId && (mode === 'edit' || file)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!canSubmit) return
        setSaving(true)
        try {
            const common = {
                name: name.trim(),
                categoryId: catId,
                icon: icon || undefined,
                color: color || undefined,
                tags: parseTags(tagsText),
            }
            if (mode === 'create') {
                const buffer = await file!.arrayBuffer()
                const id = generateId()
                await window.electron.fs.saveAudio(id, buffer)
                addSound({ id, storedId: id, type, ...common })
            } else if (sound) {
                updateSound(sound.id, common)
            }
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-ui-bg/50 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-ui-surface rounded-xl border border-ui-surface2 p-6 w-[26rem] max-h-[85vh] overflow-y-auto flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-ui-text font-display font-bold text-lg">
                    {mode === 'create' ? t('audio.addSoundTitle') : t('audio.editSoundTitle')}
                </h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.name')}</p>
                        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
                            placeholder={t('audio.namePlaceholder')}
                            className="bg-ui-surface2 border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors w-full" />
                    </div>

                    {mode === 'create' && (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.type')}</p>
                            <div className="flex gap-2">
                                {(['oneshot', 'ambient'] as const).map((tp) => (
                                    <button key={tp} type="button" onClick={() => setType(tp)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            type === tp ? 'bg-arcane-light text-ui-canvas' : 'bg-ui-surface2 text-ui-text hover:bg-ui-surface2/80'
                                        }`}>
                                        {t(tp === 'oneshot' ? 'audio.typeOneshot' : 'audio.typeAmbient')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.category')}</p>
                        <select value={catId} onChange={(e) => setCatId(e.target.value)}
                            className="bg-ui-surface2 border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors w-full">
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.icon')}</p>
                        <div className="grid grid-cols-10 gap-1">
                            {Object.entries(SOUND_ICONS).map(([key, Icon]) => (
                                <button key={key} type="button" onClick={() => setIcon(icon === key ? '' : key)} title={key}
                                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
                                        icon === key ? 'border-arcane-light bg-arcane-light/15 text-arcane-light' : 'border-transparent text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.color')}</p>
                        <div className="flex gap-2">
                            {Object.keys(SOUND_COLORS).map((key) => (
                                <button key={key} type="button" onClick={() => setColor(color === key ? '' : key)} title={key}
                                    className={`w-8 h-8 rounded-lg border-2 ${SOUND_COLORS[key]} ${color === key ? 'ring-2 ring-arcane-light' : ''}`} />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.tags')}</p>
                        <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)}
                            placeholder={t('audio.tagsPlaceholder')}
                            className="bg-ui-surface2 border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors w-full" />
                    </div>

                    {mode === 'create' && (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('audio.file')}</p>
                            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                                className="bg-ui-surface2 hover:bg-ui-surface2/80 text-ui-text px-4 py-2 rounded-lg transition-colors text-sm text-left truncate">
                                {file ? file.name : t('audio.selectFile')}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={onClose}
                            className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-3 py-1.5 rounded-lg transition-colors text-sm">
                            {t('audio.cancel')}
                        </button>
                        <button type="submit" disabled={!canSubmit || saving}
                            className="bg-arcane-light hover:bg-arcane-secondary text-ui-text px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? t('audio.saving') : mode === 'create' ? t('audio.add') : t('audio.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SoundEditModal

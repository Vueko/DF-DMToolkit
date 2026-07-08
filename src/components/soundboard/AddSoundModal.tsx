import { useState, useRef } from 'react'
import { generateId } from '../../utils/generateId'
import { useT } from '../../i18n'
import type { Sound } from '../../types'

interface AddSoundModalProps {
    categoryId: string
    onAdd: (sound: Sound) => void
    onClose: () => void
}

function AddSoundModal({ categoryId, onAdd, onClose }: AddSoundModalProps) {
    const t = useT()
    const [name, setName] = useState('')
    const [type, setType] = useState<'oneshot' | 'ambient'>('oneshot')
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!name.trim() || !file) return
        setSaving(true)
        try {
            const buffer = await file.arrayBuffer()
            const id = generateId()
            await window.electron.fs.saveAudio(id, buffer)
            onAdd({ id, name: name.trim(), storedId: id, type, categoryId })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-ui-bg/50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-ui-surface rounded-xl border border-ui-surface2 p-6 w-96 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-ui-text font-display font-bold text-lg">{t('soundboard.addSoundTitle')}</h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('soundboard.name')}</p>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('soundboard.namePlaceholder')}
                            className="bg-ui-surface2 border border-ui-surface2 focus:border-arcane-light rounded-lg px-3 py-2 text-sm text-ui-text outline-none transition-colors w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('soundboard.type')}</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setType('oneshot')}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    type === 'oneshot'
                                        ? 'bg-arcane-light text-ui-canvas'
                                        : 'bg-ui-surface2 text-ui-text hover:bg-ui-surface2/80'
                                }`}
                            >
                                {t('soundboard.typeOneshot')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('ambient')}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    type === 'ambient'
                                        ? 'bg-arcane-light text-ui-canvas'
                                        : 'bg-ui-surface2 text-ui-text hover:bg-ui-surface2/80'
                                }`}
                            >
                                {t('soundboard.typeAmbient')}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('soundboard.file')}</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-ui-surface2 hover:bg-ui-surface2/80 text-ui-text px-4 py-2 rounded-lg transition-colors text-sm text-left truncate"
                        >
                            {file ? file.name : t('soundboard.selectFile')}
                        </button>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                            {t('soundboard.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || !file || saving}
                            className="bg-arcane-light hover:bg-arcane-secondary text-ui-text px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? t('soundboard.saving') : t('soundboard.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddSoundModal

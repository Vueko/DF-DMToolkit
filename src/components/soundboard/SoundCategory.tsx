import { useState } from 'react'
import { useSoundboard } from '../../context/SoundboardContext'
import { useSoundboardStore } from '../../store/soundboardStore'
import SoundButton from './SoundButton'
import AddSoundModal from './AddSoundModal'
import { useT } from '../../i18n'
import type { Sound, SoundCategory as SoundCategoryType } from '../../types'

interface SoundCategoryProps {
    category: SoundCategoryType
    sounds: Sound[]
    activeAmbientIds: string[]
}

function SoundCategory({ category, sounds, activeAmbientIds }: SoundCategoryProps) {
    const t = useT()
    const [isRenaming, setIsRenaming] = useState(false)
    const [draftName, setDraftName] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)

    const { toggleAmbient, playOneshot, stopAmbient } = useSoundboard()
    const { renameCategory, removeCategory, addSound, removeSound, updateSound } = useSoundboardStore()

    const handleRenameConfirm = () => {
        if (draftName.trim()) renameCategory(category.id, draftName.trim())
        setIsRenaming(false)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameConfirm()
        if (e.key === 'Escape') setIsRenaming(false)
    }

    const handleRemoveSound = async (sound: Sound) => {
        if (sound.type === 'ambient') stopAmbient(sound.id)
        await window.electron.fs.deleteAudio(sound.storedId)
        removeSound(sound.id)
    }

    const handleRemoveCategory = async () => {
        sounds
            .filter((s) => s.type === 'ambient' && activeAmbientIds.includes(s.id))
            .forEach((s) => stopAmbient(s.id))
        try {
            await Promise.all(sounds.map((s) => window.electron.fs.deleteAudio(s.storedId)))
        } finally {
            removeCategory(category.id)
        }
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-3 group">
            <div className="flex items-center justify-between">
                {isRenaming ? (
                    <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onBlur={handleRenameConfirm}
                        onKeyDown={handleRenameKeyDown}
                        className="bg-transparent text-ui-muted text-[10px] font-bold uppercase tracking-wider outline-none border-b border-arcane-light"
                    />
                ) : (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">
                        {category.name}
                    </p>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => { setDraftName(category.name); setIsRenaming(true) }}
                        className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-xs"
                    >
                        {t('soundboard.rename')}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-xs"
                    >
                        {t('soundboard.addSound')}
                    </button>
                    <button
                        onClick={handleRemoveCategory}
                        className="text-red-500 hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors text-xs"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {sounds.length === 0 ? (
                <p className="text-ui-muted text-xs italic text-center py-2">
                    {t('soundboard.noSounds')}
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {sounds.map((sound) => (
                        <SoundButton
                            key={sound.id}
                            sound={sound}
                            isActive={activeAmbientIds.includes(sound.id)}
                            onPlay={() =>
                                sound.type === 'ambient'
                                    ? toggleAmbient(sound)
                                    : playOneshot(sound)
                            }
                            onRemove={() => handleRemoveSound(sound)}
                            onMoodChange={(mood) => updateSound(sound.id, { mood })}
                        />
                    ))}
                </div>
            )}

            {showAddModal && (
                <AddSoundModal
                    categoryId={category.id}
                    onAdd={(sound) => addSound(sound)}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    )
}

export default SoundCategory

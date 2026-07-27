import { useState } from 'react'
import { useSoundboardStore } from '../store/soundboardStore'
import { useSoundboard } from '../context/SoundboardContext'
import { useAllSounds } from '../audio/useAllSounds'
import { allTags } from '../audio/filterSounds'
import { useT } from '../i18n'
import DiceTray from './dice/DiceTray'
import type { Sound } from '../types'

function SoundQuickBar() {
    const t = useT()
    const sounds = useAllSounds()
    const { activeAmbientIds } = useSoundboardStore()
    const { toggleAmbient, playOneshot } = useSoundboard()
    const [activeTab, setActiveTab] = useState<string | null>(null)

    // La barra se muestra siempre para que la bandeja de dados (a la derecha) esté disponible,
    // aunque no haya sonidos con etiquetas todavía.
    const tags = allTags(sounds)
    const effectiveTab = activeTab && tags.includes(activeTab) ? activeTab : tags[0]
    const tabSounds = tags.length > 0 ? sounds.filter((s) => (s.tags ?? []).includes(effectiveTab)) : []

    function handlePlay(sound: Sound) {
        if (sound.type === 'ambient') toggleAmbient(sound)
        else playOneshot(sound)
    }

    return (
        <div className="bg-ui-surface border-t border-ui-surface2/40 px-4 flex items-center gap-3 h-10 shrink-0">
            {tags.length > 0 ? (
                <>
                    <div className="flex items-center gap-0.5 shrink-0 overflow-x-auto max-w-[40%]">
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setActiveTab(tag)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-colors shrink-0 ${
                                    tag === effectiveTab
                                        ? 'bg-arcane-light/15 text-arcane-light'
                                        : 'text-ui-muted opacity-60 hover:opacity-100'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-ui-surface2 shrink-0" />

                    <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
                        {tabSounds.map((sound) => {
                            const isActive = activeAmbientIds.includes(sound.id)
                            return (
                                <button
                                    key={sound.id}
                                    onClick={() => handlePlay(sound)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 ${
                                        sound.type === 'ambient' && isActive
                                            ? 'bg-arcane-light/20 text-arcane-light border border-arcane-light/40'
                                            : sound.type === 'ambient'
                                            ? 'bg-ui-surface2 text-ui-muted border border-arcane-light/20 hover:text-ui-text'
                                            : 'bg-ui-surface2 text-ui-muted border border-ui-surface2/60 hover:text-ui-text'
                                    }`}
                                >
                                    {sound.name}
                                    {sound.type === 'ambient' && isActive && (
                                        <span className="text-[9px] opacity-60">{t('audio.loop')}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="w-px h-5 bg-ui-surface2 shrink-0" />
                </>
            ) : (
                <div className="flex-1" />
            )}

            <DiceTray />
        </div>
    )
}

export default SoundQuickBar

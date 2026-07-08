import { useState } from 'react'
import { useSoundboardStore } from '../store/soundboardStore'
import { useSoundboard } from '../context/SoundboardContext'
import { useT } from '../i18n'
import type { Sound } from '../types'

const MOOD_OPTIONS = ['calm', 'tense', 'epic', 'mystery', 'ambient'] as const
type SoundMood = typeof MOOD_OPTIONS[number]

const MOOD_LABELS: Record<SoundMood, string> = {
    calm: 'soundboard.moodCalm',
    tense: 'soundboard.moodTense',
    epic: 'soundboard.moodEpic',
    mystery: 'soundboard.moodMystery',
    ambient: 'soundboard.moodAmbient',
}

const MOOD_TAB_COLORS: Record<SoundMood, string> = {
    calm: 'text-danger-secondary',
    tense: 'text-danger-primary',
    epic: 'text-danger-yellow',
    mystery: 'text-arcane-light',
    ambient: 'text-ui-muted',
}

const MOOD_TAB_ACTIVE: Record<SoundMood, string> = {
    calm: 'bg-danger-secondary/15 text-danger-secondary',
    tense: 'bg-danger-primary/15 text-danger-primary',
    epic: 'bg-danger-yellow/15 text-danger-yellow',
    mystery: 'bg-arcane-light/15 text-arcane-light',
    ambient: 'bg-ui-muted/15 text-ui-muted',
}

function SoundQuickBar() {
    const t = useT()
    const { sounds, activeAmbientIds } = useSoundboardStore()
    const { toggleAmbient, playOneshot } = useSoundboard()
    const [activeTab, setActiveTab] = useState<SoundMood | null>(null)

    const moodsWithSounds = MOOD_OPTIONS.filter((m) => sounds.some((s) => s.mood === m))

    if (moodsWithSounds.length === 0) return null

    const effectiveTab: SoundMood =
        activeTab && moodsWithSounds.includes(activeTab) ? activeTab : moodsWithSounds[0]

    const tabSounds = sounds.filter((s) => s.mood === effectiveTab)

    function handlePlay(sound: Sound) {
        if (sound.type === 'ambient') toggleAmbient(sound)
        else playOneshot(sound)
    }

    return (
        <div className="bg-ui-surface border-t border-ui-surface2/40 px-4 flex items-center gap-3 h-10 shrink-0">
            <div className="flex items-center gap-0.5 shrink-0">
                {moodsWithSounds.map((m) => (
                    <button
                        key={m}
                        onClick={() => setActiveTab(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-colors ${
                            m === effectiveTab
                                ? MOOD_TAB_ACTIVE[m]
                                : `${MOOD_TAB_COLORS[m]} opacity-40 hover:opacity-70`
                        }`}
                    >
                        {t(MOOD_LABELS[m])}
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
                                <span className="text-[9px] opacity-60">{t('soundboard.loop')}</span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default SoundQuickBar

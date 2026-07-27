import { SoundIconByKey } from './soundIcons'
import { useT } from '../../i18n'
import type { Sound } from '../../types'

// eslint-disable-next-line react-refresh/only-export-components
export const SOUND_COLORS: Record<string, string> = {
    arcane: 'border-arcane-light/40 bg-arcane-light/10 text-arcane-light',
    ember: 'border-danger-primary/40 bg-danger-primary/10 text-danger-primary',
    gold: 'border-danger-yellow/40 bg-danger-yellow/10 text-danger-yellow',
    rose: 'border-danger-secondary/40 bg-danger-secondary/10 text-danger-secondary',
    neutral: 'border-ui-surface2 bg-ui-surface text-ui-text',
}

interface SoundPadProps {
    sound: Sound
    isActive: boolean
    onPlay: () => void
    onEdit?: () => void
    onRemove?: () => void
    onHide?: () => void
}

function SoundPad({ sound, isActive, onPlay, onEdit, onRemove, onHide }: SoundPadProps) {
    const t = useT()
    const colorClass = SOUND_COLORS[sound.color ?? ''] ?? SOUND_COLORS.neutral
    const activeClass = sound.type === 'ambient' && isActive ? 'ring-2 ring-arcane-light' : ''

    return (
        <div className="relative group/pad">
            <button
                onClick={onPlay}
                className={`w-full flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border transition-colors hover:brightness-110 ${colorClass} ${activeClass}`}
                title={sound.type === 'ambient' ? t('audio.toggleAmbient') : t('audio.playOneshot')}
            >
                <SoundIconByKey icon={sound.icon} className="w-6 h-6" />
                <span className="text-xs font-medium truncate max-w-full">{sound.name}</span>
                {sound.type === 'ambient' && (
                    <span className={`text-[9px] uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                        {isActive ? t('audio.looping') : t('audio.loop')}
                    </span>
                )}
            </button>
            <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover/pad:opacity-100 transition-opacity">
                {onEdit && (
                    <button onClick={onEdit} title={t('audio.edit')}
                        className="bg-ui-canvas border border-ui-surface2 rounded-full text-ui-muted hover:text-ui-text text-[10px] w-5 h-5 flex items-center justify-center">
                        ✎
                    </button>
                )}
                {onRemove && (
                    <button onClick={onRemove} title={t('audio.delete')}
                        className="bg-ui-canvas border border-ui-surface2 rounded-full text-red-500 hover:text-red-600 text-[10px] w-5 h-5 flex items-center justify-center">
                        ✕
                    </button>
                )}
                {onHide && (
                    <button onClick={onHide} title={t('audio.hide')}
                        className="bg-ui-canvas border border-ui-surface2 rounded-full text-ui-muted hover:text-ui-text text-[10px] w-5 h-5 flex items-center justify-center">
                        —
                    </button>
                )}
            </div>
        </div>
    )
}

export default SoundPad

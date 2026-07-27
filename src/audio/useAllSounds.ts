import { useMemo } from 'react'
import { useSoundboardStore } from '../store/soundboardStore'
import { useSettingsStore } from '../store/settingsStore'
import { translate } from '../i18n'
import { BUILTIN_SOUNDS, type BuiltinSoundDef } from './builtinSounds'
import type { Sound } from '../types'

export function builtinToSound(def: BuiltinSoundDef, name: string): Sound {
    return {
        id: def.id, name, storedId: def.file, type: def.type,
        categoryId: '', icon: def.icon, tags: def.tags, builtin: true,
    }
}

export function visibleBuiltins(hiddenIds: string[]): BuiltinSoundDef[] {
    return BUILTIN_SOUNDS.filter((b) => !hiddenIds.includes(b.id))
}

/** Builtins visibles (nombre según idioma) + sonidos del usuario, en ese orden. */
export function useAllSounds(): Sound[] {
    const sounds = useSoundboardStore((s) => s.sounds)
    const hidden = useSoundboardStore((s) => s.hiddenBuiltinIds)
    const lang = useSettingsStore((s) => s.language)
    return useMemo(
        () => [...visibleBuiltins(hidden).map((b) => builtinToSound(b, translate(lang, b.nameKey))), ...sounds],
        [sounds, hidden, lang]
    )
}

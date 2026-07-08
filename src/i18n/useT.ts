import { useSettingsStore } from '../store/settingsStore'
import { translate } from './translate'

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
    const lang = useSettingsStore((s) => s.language)
    return (key, vars) => translate(lang, key, vars)
}

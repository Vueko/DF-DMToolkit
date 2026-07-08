import { translations, type Lang } from './translations'

export function translate(
    lang: Lang,
    key: string,
    vars?: Record<string, string | number>,
    dict: Record<string, Record<string, string>> = translations,
): string {
    const template = dict[lang]?.[key] ?? dict.en?.[key] ?? key
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? String(vars[name]) : `{${name}}`))
}

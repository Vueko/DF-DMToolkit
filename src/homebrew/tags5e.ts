const ATK: Record<string, string> = {
    mw: 'Melee Weapon Attack:', rw: 'Ranged Weapon Attack:',
    ms: 'Melee Spell Attack:', rs: 'Ranged Spell Attack:',
}

// Traduce las etiquetas inline de 5etools ({@tag valor|extra}) a texto/markdown.
export function strip5eTags(text: string): string {
    return text.replace(/\{@(\w+)(?:\s+([^}]*))?\}/g, (_m, tag: string, rest: string | undefined) => {
        const body = rest ?? ''
        const display = body.split('|')[0]
        switch (tag) {
            case 'h': return 'Hit: '
            case 'dc': return `DC ${body}`
            case 'hit': return body.startsWith('-') ? body : `+${body}`
            case 'atk': return ATK[body.trim()] ?? `${body}:`
            case 'recharge': return body ? `(Recharge ${body}–6)` : '(Recharge 6)'
            case 'b': case 'bold': return `**${display}**`
            case 'i': case 'italic': return `*${display}*`
            default: return display
        }
    })
}

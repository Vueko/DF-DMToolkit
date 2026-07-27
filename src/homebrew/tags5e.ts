const ATK: Record<string, string> = {
    mw: 'Melee Weapon Attack:', rw: 'Ranged Weapon Attack:',
    ms: 'Melee Spell Attack:', rs: 'Ranged Spell Attack:',
}

// Formato 2024: tiradas de ataque y salvaciones estructuradas.
const ATKR: Record<string, string> = {
    'm': 'Melee Attack Roll:', 'r': 'Ranged Attack Roll:', 'm,r': 'Melee or Ranged Attack Roll:',
}
const SAVE_ABILITY: Record<string, string> = {
    str: 'Strength', dex: 'Dexterity', con: 'Constitution',
    int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

// Traduce las etiquetas inline de 5etools ({@tag valor|extra}) a texto/markdown.
export function strip5eTags(text: string): string {
    return text.replace(/\{@(\w+)(?:\s+([^}]*))?\}/g, (_m, tag: string, rest: string | undefined) => {
        const body = rest ?? ''
        switch (tag) {
            case 'h': return 'Hit: '
            case 'dc': return `DC ${body}`
            case 'hit': return body.startsWith('-') ? body : `+${body}`
            case 'atk': return ATK[body.trim()] ?? `${body}:`
            case 'atkr': return ATKR[body.replace(/\s+/g, '')] ?? 'Attack Roll:'
            case 'actSave': return `${SAVE_ABILITY[body.trim()] ?? body.trim()} Saving Throw:`
            case 'actSaveFail': return 'Failure:'
            case 'actSaveSuccess': return 'Success:'
            case 'actSaveSuccessOrFail': return 'Failure or Success:'
            case 'actTrigger': return 'Trigger:'
            case 'actResponse': return body.trim() === 'd' ? 'Response — Damage:' : 'Response:'
            case 'recharge': return body ? `(Recharge ${body}–6)` : '(Recharge 6)'
            case 'b': case 'bold': return `**${body.split('|')[0]}**`
            case 'i': case 'italic': return `*${body.split('|')[0]}*`
            default: {
                // Con 3+ segmentos, el último es el texto visible (display override de 5etools).
                const segs = body.split('|')
                return segs.length >= 3 ? segs[segs.length - 1] : segs[0]
            }
        }
    })
}

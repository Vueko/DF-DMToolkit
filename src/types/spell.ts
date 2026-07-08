export interface Spell {
    key: string
    name: string
    level: number          // 0 = cantrip
    school: string
    castingTime: string
    range: string
    components: string      // "V, S, M (…)"
    duration: string
    concentration: boolean
    ritual: boolean
    desc: string
    classes: string[]
    source?: 'srd' | 'homebrew'
    collectionId?: string
}

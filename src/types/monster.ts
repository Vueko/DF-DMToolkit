export type MonsterSource = 'srd' | 'homebrew'

// usage: "Recharge 5–6", "2/Day", "Costs 2 Actions"...
export interface MonsterAbility {
    id: string
    name: string
    description: string
    usage?: string
}

export interface MonsterStats {
    str: number; dex: number; con: number; int: number; wis: number; cha: number
}

export interface Monster {
    id: string                    // srd:<key de Open5e> | hb:<uuid>
    source: MonsterSource
    name: string
    size: string
    type: string
    alignment: string
    ac: number
    acNote?: string
    hp: { average: number; formula?: string }
    speed: string
    stats: MonsterStats
    saves?: string
    skills?: string
    vulnerabilities?: string
    resistances?: string
    immunities?: string
    conditionImmunities?: string
    senses?: string
    languages?: string
    cr: number                    // 0, 0.125, 0.25, 0.5, 1..30
    xp: number
    passives: MonsterAbility[]
    actions: MonsterAbility[]
    bonusActions: MonsterAbility[]   // sección propia en statblocks 2024
    reactions: MonsterAbility[]
    legendaryActions: MonsterAbility[]
    legendaryResistance?: number  // usos por día
    lairActions?: MonsterAbility[]
    imageStoredId?: string        // opcional, homebrew
    collectionId?: string         // colección homebrew de la que proviene (sin ella = creado a mano)
}

export interface HomebrewCollection {
    id: string
    name: string          // de _meta.sources[0].full, o nombre de fichero
    source: string        // abreviatura (casa con el campo `source` de las entradas 5etools)
    authors?: string[]
    enabled: boolean       // desactivada = oculta en navegadores, no se borra
    addedAt: string        // ISO
}

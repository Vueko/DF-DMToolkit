export interface MagicItem {
    key: string
    name: string
    type: string           // category.name (Armor, Wondrous Item, …)
    rarity: string         // rarity.name (Common, Uncommon, …)
    requiresAttunement: boolean
    attunementDetail: string | null
    desc: string
    source?: 'srd' | 'homebrew'
    collectionId?: string
}

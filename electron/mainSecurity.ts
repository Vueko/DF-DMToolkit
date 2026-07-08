export const STORE_KEYS = new Set([
    'dnd-campaigns',
    'dnd-bestiary',
    'dnd-homebrew',
    'dnd-party',
    'dnd-combat',
    'dnd-music',
    'dnd-soundboard',
    'dnd-settings',
])

export const VAULT_IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

export function isAllowedStoreKey(key: unknown): key is string {
    return typeof key === 'string' && STORE_KEYS.has(key)
}

export function isAllowedVaultImageExtension(ext: unknown): ext is string {
    return typeof ext === 'string' && VAULT_IMAGE_EXT.has(ext.toLowerCase())
}

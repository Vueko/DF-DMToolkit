import { describe, expect, it } from 'vitest'
import { isAllowedStoreKey, isAllowedVaultImageExtension } from './mainSecurity'

describe('main process security helpers', () => {
    it('allows only known persisted store keys', () => {
        expect(isAllowedStoreKey('dnd-campaigns')).toBe(true)
        expect(isAllowedStoreKey('dnd-settings')).toBe(true)

        expect(isAllowedStoreKey('dh-campaigns')).toBe(false)
        expect(isAllowedStoreKey('../store.json')).toBe(false)
        expect(isAllowedStoreKey('')).toBe(false)
    })

    it('rejects svg vault images because svg can execute active content', () => {
        expect(isAllowedVaultImageExtension('.png')).toBe(true)
        expect(isAllowedVaultImageExtension('.jpg')).toBe(true)
        expect(isAllowedVaultImageExtension('.jpeg')).toBe(true)
        expect(isAllowedVaultImageExtension('.gif')).toBe(true)
        expect(isAllowedVaultImageExtension('.webp')).toBe(true)

        expect(isAllowedVaultImageExtension('.svg')).toBe(false)
        expect(isAllowedVaultImageExtension('.html')).toBe(false)
    })
})

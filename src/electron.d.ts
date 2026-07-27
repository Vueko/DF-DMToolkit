export {}

declare global {
    interface Window {
        electron: {
            platform: string
            setZoom: (factor: number) => void
            getVersion: () => Promise<string>
            window: {
                minimize: () => void
                maximize: () => void
                close: () => void
                isMaximized: () => Promise<boolean>
                onMaximize: (callback: (isMaximized: boolean) => void) => () => void
            }
            store: {
                get: (key: string) => Promise<unknown>
                set: (key: string, value: unknown) => void
                delete: (key: string) => void
                backup: () => Promise<void>
            }
            fs: {
                saveAudio: (id: string, data: ArrayBuffer) => Promise<void>
                getAudio: (id: string) => Promise<Uint8Array | null>
                deleteAudio: (id: string) => Promise<void>
                getBuiltinAudio: (file: string) => Promise<Uint8Array | null>
                saveMapImage: (id: string, data: ArrayBuffer) => Promise<void>
                getMapImage: (id: string) => Promise<Uint8Array | null>
                deleteMapImage: (id: string) => Promise<void>
                savePlayerImage: (id: string, data: ArrayBuffer) => Promise<void>
                getPlayerImage: (id: string) => Promise<Uint8Array | null>
                deletePlayerImage: (id: string) => Promise<void>
            }
            dialog: {
                saveJson: (content: string, options: {
                    defaultPath?: string
                    filters?: { name: string; extensions: string[] }[]
                }) => Promise<{ canceled: boolean }>
                openJson: (options: {
                    filters?: { name: string; extensions: string[] }[]
                }) => Promise<{ canceled: boolean; content: string | null }>
            }
            player: {
                open: (displayIndex?: number) => void
                getDisplays: () => Promise<{ index: number; label: string; isPrimary: boolean }[]>
                close: () => void
                setMap: (storedId: string) => void
                clearMap: () => void
                showOverlay: (storedId: string, name: string) => void
                clearOverlay: () => void
                isOpen: () => Promise<boolean>
                captureMap: (rect: { x: number; y: number; width: number; height: number }) => Promise<void>
                setCampaignMap: (storedId: string) => void
                setFog: (zones: import('./types').FogZone[]) => void
                setViewport: (viewport: import('./types').PlayerViewport) => void
                getWindowBounds: () => Promise<{ width: number; height: number } | null>
                ready: () => void
                setRotation: (rotation: 0 | 90) => void
                setInitiative: (payload: import('./types').PlayerInitiativePayload | null) => void
            }
            vault: {
                pickFolder: () => Promise<string | null>
                readTree: (root: string) => Promise<import('./types').VaultNode | null>
                readFile: (rel: string) => Promise<string | null>
                readImage: (rel: string) => Promise<Uint8Array | null>
                readBinary: (rel: string) => Promise<Uint8Array | null>
                search: (query: string) => Promise<import('./types').VaultSearchResult[]>
            }
            srd: {
                get: (resource: import('./types').SrdResource, key?: string, version?: string) => Promise<import('./types').SrdResult>
                prefetchAll: (version?: string) => Promise<import('./types').SrdPrefetchSummary>
                cacheStatus: (version?: string) => Promise<import('./types').SrdCacheStatus[]>
                versions: () => Promise<import('./types').SrdVersion[]>
                clearCache: () => Promise<void>
                onPrefetchProgress: (cb: (p: import('./types').SrdPrefetchProgress) => void) => () => void
            }
            updater: {
                check: () => Promise<void>
                download: () => Promise<void>
                install: () => void
                onEvent: (cb: (ev: import('./store/updateStore').UpdaterEvent) => void) => () => void
            }
            on: (channel: 'player:set-map' | 'player:clear-map' | 'player:show-overlay' | 'player:clear-overlay' | 'player:closed' | 'player:set-fog' | 'player:set-viewport' | 'player:set-campaign-map' | 'player:set-rotation' | 'player:set-initiative', cb: (...args: unknown[]) => void) => () => void
        }
    }
}
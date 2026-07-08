import { contextBridge, ipcRenderer, webFrame } from 'electron'
import type { IpcRendererEvent } from 'electron'

const PLAYER_CHANNELS = ['player:set-map', 'player:clear-map', 'player:show-overlay', 'player:clear-overlay', 'player:closed', 'player:set-fog', 'player:set-viewport', 'player:set-campaign-map', 'player:set-rotation', 'player:set-initiative'] as const

contextBridge.exposeInMainWorld('electron', {
    platform: process.platform,
    setZoom: (factor: number) => webFrame.setZoomFactor(factor),
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

    window: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
        onMaximize: (cb: (v: boolean) => void) => {
            const handler = (_: IpcRendererEvent, value: boolean) => cb(value)
            ipcRenderer.on('window:maximized', handler)
            return () => ipcRenderer.off('window:maximized', handler)
        },
    },

    store: {
        get: (key: string): Promise<unknown> => ipcRenderer.invoke('store:get', key),
        set: (key: string, value: unknown): void => ipcRenderer.send('store:set', key, value),
        delete: (key: string): void => ipcRenderer.send('store:delete', key),
        backup: (): Promise<void> => ipcRenderer.invoke('store:backup'),
    },

    fs: {
        saveAudio: (id: string, data: ArrayBuffer): Promise<void> =>
            ipcRenderer.invoke('fs:save-audio', id, new Uint8Array(data)),
        getAudio: (id: string): Promise<Uint8Array | null> =>
            ipcRenderer.invoke('fs:get-audio', id),
        deleteAudio: (id: string): Promise<void> =>
            ipcRenderer.invoke('fs:delete-audio', id),
        saveMapImage: (id: string, data: ArrayBuffer): Promise<void> =>
            ipcRenderer.invoke('fs:save-map-image', id, new Uint8Array(data)),
        getMapImage: (id: string): Promise<Uint8Array | null> =>
            ipcRenderer.invoke('fs:get-map-image', id),
        deleteMapImage: (id: string): Promise<void> =>
            ipcRenderer.invoke('fs:delete-map-image', id),
        savePlayerImage: (id: string, data: ArrayBuffer): Promise<void> =>
            ipcRenderer.invoke('fs:save-player-image', id, new Uint8Array(data)),
        getPlayerImage: (id: string): Promise<Uint8Array | null> =>
            ipcRenderer.invoke('fs:get-player-image', id),
        deletePlayerImage: (id: string): Promise<void> =>
            ipcRenderer.invoke('fs:delete-player-image', id),
    },

    dialog: {
        saveJson: (content: string, options: Electron.SaveDialogOptions): Promise<{ canceled: boolean }> =>
            ipcRenderer.invoke('dialog:save-json', content, options),
        openJson: (options: Electron.OpenDialogOptions): Promise<{ canceled: boolean; content: string | null }> =>
            ipcRenderer.invoke('dialog:open-json', options),
    },

    player: {
        open: (displayIndex?: number) => ipcRenderer.send('player:open', displayIndex),
        getDisplays: (): Promise<{ index: number; label: string; isPrimary: boolean }[]> =>
            ipcRenderer.invoke('player:get-displays'),
        close: () => ipcRenderer.send('player:close'),
        setMap: (storedId: string) => ipcRenderer.send('player:set-map', storedId),
        clearMap: () => ipcRenderer.send('player:clear-map'),
        showOverlay: (storedId: string, name: string) => ipcRenderer.send('player:show-overlay', storedId, name),
        clearOverlay: () => ipcRenderer.send('player:clear-overlay'),
        isOpen: (): Promise<boolean> => ipcRenderer.invoke('player:is-open'),
        captureMap: (rect: { x: number; y: number; width: number; height: number }): Promise<void> =>
            ipcRenderer.invoke('player:capture-map', rect),
        setCampaignMap: (storedId: string) => ipcRenderer.send('player:set-campaign-map', storedId),
        setFog: (zones: unknown[]) => ipcRenderer.send('player:set-fog', zones),
        setViewport: (viewport: { offsetX: number; offsetY: number; scale: number }) =>
            ipcRenderer.send('player:set-viewport', viewport),
        getWindowBounds: (): Promise<{ width: number; height: number } | null> =>
            ipcRenderer.invoke('player:get-window-bounds'),
        ready: () => ipcRenderer.send('player:ready'),
        setRotation: (rotation: 0 | 90) => ipcRenderer.send('player:set-rotation', rotation),
        setInitiative: (payload: unknown) => ipcRenderer.send('player:set-initiative', payload),
    },

    vault: {
        pickFolder: (): Promise<string | null> => ipcRenderer.invoke('vault:pick-folder'),
        readTree: (root: string): Promise<unknown> => ipcRenderer.invoke('vault:read-tree', root),
        readFile: (rel: string): Promise<string | null> => ipcRenderer.invoke('vault:read-file', rel),
        readImage: (rel: string): Promise<Uint8Array | null> => ipcRenderer.invoke('vault:read-image', rel),
        search: (query: string): Promise<unknown> => ipcRenderer.invoke('vault:search', query),
    },

    srd: {
        get: (resource: string, key?: string, version?: string): Promise<unknown> =>
            ipcRenderer.invoke('srd:get', resource, key, version),
        prefetchAll: (version?: string): Promise<unknown> => ipcRenderer.invoke('srd:prefetch-all', version),
        cacheStatus: (version?: string): Promise<unknown> => ipcRenderer.invoke('srd:cache-status', version),
        versions: (): Promise<unknown> => ipcRenderer.invoke('srd:versions'),
        clearCache: (): Promise<void> => ipcRenderer.invoke('srd:clear-cache'),
        onPrefetchProgress: (cb: (p: unknown) => void): (() => void) => {
            const handler = (_: IpcRendererEvent, p: unknown) => cb(p)
            ipcRenderer.on('srd:prefetch-progress', handler)
            return () => ipcRenderer.off('srd:prefetch-progress', handler)
        },
    },

    updater: {
        check: (): Promise<void> => ipcRenderer.invoke('updater:check'),
        download: (): Promise<void> => ipcRenderer.invoke('updater:download'),
        install: (): void => ipcRenderer.send('updater:install'),
        onEvent: (cb: (ev: unknown) => void): (() => void) => {
            const handler = (_: IpcRendererEvent, ev: unknown) => cb(ev)
            ipcRenderer.on('updater:event', handler)
            return () => ipcRenderer.off('updater:event', handler)
        },
    },

    on: (channel: string, cb: (...args: unknown[]) => void): (() => void) => {
        if (!(PLAYER_CHANNELS as readonly string[]).includes(channel)) return () => {}
        const handler = (_: IpcRendererEvent, ...args: unknown[]) => cb(...args)
        ipcRenderer.on(channel, handler)
        return () => ipcRenderer.off(channel, handler)
    },
})
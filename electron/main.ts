import { app, BrowserWindow, Menu, shell, ipcMain, dialog, session, screen } from 'electron'
import { join } from 'path'
import * as path from 'path'
import * as fs from 'fs'
import { autoUpdater } from 'electron-updater'
import { registerSrdIpc } from './srd'
import { isAllowedStoreKey, isAllowedVaultImageExtension, VAULT_IMAGE_EXT } from './mainSecurity'
import { resolveBuiltinPath } from './builtinAudio'

// Allows UUIDs and simple slug IDs (e.g. "shared-map"), blocks path traversal
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/


// Renombrado one-shot de keys del fork de Daggerheart (dh-*). dh-fear y dh-cards
// se descartan: esos subsistemas no existen en esta app.
const LEGACY_KEY_RENAMES: Record<string, string> = {
  'dh-campaigns': 'dnd-campaigns',
  'dh-music': 'dnd-music',
  'dh-soundboard': 'dnd-soundboard',
  'dh-settings': 'dnd-settings',
}

class DataStore {
  private readonly filePath: string
  private cache: Record<string, unknown> = {}
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.filePath = join(app.getPath('userData'), 'store.json')
    this.load()
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        this.cache = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      }
    } catch { /* corrupt or unreadable store: start with an empty cache */ }
    this.migrateLegacyKeys()
  }

  private migrateLegacyKeys(): void {
    let changed = false
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_RENAMES)) {
      if (oldKey in this.cache && !(newKey in this.cache)) {
        this.cache[newKey] = this.cache[oldKey]
        changed = true
      }
    }
    for (const key of Object.keys(this.cache)) {
      if (key.startsWith('dh-')) {
        delete this.cache[key]
        changed = true
      }
    }
    if (changed) this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => this.flush(), 150)
  }

  private flush(): void {
    const tmp = `${this.filePath}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(this.cache))
    fs.renameSync(tmp, this.filePath)
  }

  get(key: string): unknown { return this.cache[key] ?? null }
  set(key: string, value: unknown): void { this.cache[key] = value; this.scheduleFlush() }
  delete(key: string): void { delete this.cache[key]; this.scheduleFlush() }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

let mainWindow: BrowserWindow | null = null
let playerWin: BrowserWindow | null = null

let vaultRoot: string | null = null
let didBackupThisSession = false


function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}

function isInsideRoot(root: string, target: string): boolean {
  const rel = path.relative(root, target)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

interface VaultNodeShape {
  name: string
  path: string
  type: 'folder' | 'note' | 'image'
  children?: VaultNodeShape[]
}

function buildVaultTree(absDir: string, root: string): VaultNodeShape {
  const children: VaultNodeShape[] = []
  let entries: fs.Dirent[] = []
  try { entries = fs.readdirSync(absDir, { withFileTypes: true }) } catch { entries = [] }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const abs = path.join(absDir, e.name)
    if (e.isDirectory()) {
      children.push(buildVaultTree(abs, root))
    } else {
      const ext = path.extname(e.name).toLowerCase()
      if (ext === '.md') children.push({ name: e.name, path: toPosix(path.relative(root, abs)), type: 'note' })
      else if (VAULT_IMAGE_EXT.has(ext)) children.push({ name: e.name, path: toPosix(path.relative(root, abs)), type: 'image' })
    }
  }
  children.sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })
  return { name: path.basename(absDir), path: toPosix(path.relative(root, absDir)), type: 'folder', children }
}

interface VaultSearchResult {
  path: string
  name: string
  snippet: string
  nameMatch: boolean
}

function makeSnippet(content: string, matchIndex: number): string {
  const start = Math.max(0, matchIndex - 30)
  const end = Math.min(content.length, matchIndex + 60)
  const raw = content.slice(start, end).replace(/\s+/g, ' ').trim()
  return (start > 0 ? '…' : '') + raw + (end < content.length ? '…' : '')
}

function searchVault(root: string, query: string): VaultSearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const results: VaultSearchResult[] = []
  const walk = (absDir: string): void => {
    let entries: fs.Dirent[] = []
    try { entries = fs.readdirSync(absDir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue
      const abs = path.join(absDir, e.name)
      if (e.isDirectory()) { walk(abs); continue }
      if (path.extname(e.name).toLowerCase() !== '.md') continue
      const base = e.name.replace(/\.md$/i, '')
      const nameMatch = base.toLowerCase().includes(q)
      let snippet = ''
      let contentMatch = false
      try {
        const content = fs.readFileSync(abs, 'utf-8')
        const idx = content.toLowerCase().indexOf(q)
        if (idx !== -1) { contentMatch = true; snippet = makeSnippet(content, idx) }
      } catch { /* unreadable file: skip content match */ }
      if (nameMatch || contentMatch) {
        results.push({ path: toPosix(path.relative(root, abs)), name: base, snippet, nameMatch })
      }
    }
  }
  walk(root)
  results.sort((a, b) => (a.nameMatch === b.nameMatch ? a.name.localeCompare(b.name) : a.nameMatch ? -1 : 1))
  return results.slice(0, 100)
}

// Pending state to replay when player window signals it's ready
let pendingMapId: string | null = null
let pendingFog: unknown[] | null = null
let pendingViewport: { offsetX: number; offsetY: number; scale: number } | null = null
let pendingRotation: 0 | 90 = 0
let pendingInitiative: unknown = null

function sendUpdaterEvent(ev: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:event', ev)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  })

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized', true))
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false))
  mainWindow.on('closed', () => {
    mainWindow = null
    if (playerWin && !playerWin.isDestroyed()) playerWin.close()
  })

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const { protocol } = new URL(details.url)
      if (protocol === 'https:' || protocol === 'http:') shell.openExternal(details.url)
    } catch { /* malformed URL: fall through and deny */ }
    return { action: 'deny' }
  })
}

function createPlayerWindow(displayIndex?: number): void {
    if (playerWin && !playerWin.isDestroyed()) {
        playerWin.focus()
        return
    }
    const displays = screen.getAllDisplays()
    const idx = displayIndex !== undefined
        ? Math.min(Math.max(0, displayIndex), displays.length - 1)
        : displays.length > 1 ? 1 : 0
    const { x, y, width, height } = displays[idx].bounds
    playerWin = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
        show: false,
    })
    playerWin.on('closed', () => {
        playerWin = null
        mainWindow?.webContents.send('player:closed')
    })
    if (!app.isPackaged) {
        playerWin.loadURL('http://localhost:5173/#/player-screen')
    } else {
        playerWin.loadFile(join(__dirname, '../dist/index.html'), { hash: '/player-screen' })
    }
    playerWin.once('ready-to-show', () => playerWin?.show())

    // After the page finishes loading, wait for React effects to register their
    // ipcRenderer listeners (effects run async after paint), then replay pending state.
    playerWin.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            if (!playerWin || playerWin.isDestroyed()) return
            if (pendingMapId) playerWin.webContents.send('player:set-map', pendingMapId)
            if (pendingFog) playerWin.webContents.send('player:set-fog', pendingFog)
            if (pendingViewport) playerWin.webContents.send('player:set-viewport', pendingViewport)
            playerWin.webContents.send('player:set-rotation', pendingRotation)
            playerWin.webContents.send('player:set-initiative', pendingInitiative)
        }, 300)
    })
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self';"
          ],
        },
      })
    })
  }

  Menu.setApplicationMenu(null)

  const store = new DataStore()
  const audioDir = join(app.getPath('userData'), 'audio')
  const mapsDir = join(app.getPath('userData'), 'maps')
  const playerScreenDir = join(app.getPath('userData'), 'player-screen')
  ensureDir(audioDir)
  ensureDir(mapsDir)
  ensureDir(playerScreenDir)

  registerSrdIpc(join(app.getPath('userData'), 'srd-cache'), (p) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('srd:prefetch-progress', p)
  })

  // The vault root is owned by main (persisted here), so the renderer cannot point the
  // vault reader at arbitrary folders. Loaded on startup; updated only via the folder picker.
  const vaultRootFile = join(app.getPath('userData'), 'vault-root')
  const persistVaultRoot = (p: string): void => {
    try { fs.writeFileSync(vaultRootFile, p, 'utf-8') } catch { /* ignore write failure */ }
  }
  try {
    if (fs.existsSync(vaultRootFile)) {
      const saved = fs.readFileSync(vaultRootFile, 'utf-8').trim()
      if (saved) vaultRoot = saved
    }
  } catch { /* ignore corrupt vault-root file */ }

  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('app:get-version', () => app.getVersion())

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.on('checking-for-update', () => sendUpdaterEvent({ type: 'checking' }))
  autoUpdater.on('update-available', (info) => sendUpdaterEvent({ type: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => sendUpdaterEvent({ type: 'not-available' }))
  autoUpdater.on('download-progress', (p) => sendUpdaterEvent({ type: 'progress', percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => sendUpdaterEvent({ type: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => sendUpdaterEvent({ type: 'error', message: err?.message ?? String(err) }))

  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      sendUpdaterEvent({ type: 'error', message: 'Actualizaciones no disponibles en desarrollo' })
      return
    }
    try { await autoUpdater.checkForUpdates() }
    catch (e) { sendUpdaterEvent({ type: 'error', message: (e as Error)?.message ?? 'Error al comprobar' }) }
  })
  ipcMain.handle('updater:download', async () => {
    try { await autoUpdater.downloadUpdate() }
    catch (e) { sendUpdaterEvent({ type: 'error', message: (e as Error)?.message ?? 'Error al descargar' }) }
  })
  ipcMain.on('updater:install', () => { autoUpdater.quitAndInstall() })

  ipcMain.handle('store:get', (_, key: string) => (isAllowedStoreKey(key) ? store.get(key) : null))
  ipcMain.on('store:set', (_, key: string, value: unknown) => { if (isAllowedStoreKey(key)) store.set(key, value) })
  ipcMain.on('store:delete', (_, key: string) => { if (isAllowedStoreKey(key)) store.delete(key) })

  ipcMain.handle('store:backup', () => {
    if (didBackupThisSession) return
    const storeFile = join(app.getPath('userData'), 'store.json')
    if (!fs.existsSync(storeFile)) return
    const dir = join(app.getPath('userData'), 'backups')
    ensureDir(dir)
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    fs.copyFileSync(storeFile, join(dir, `store-${ts}.json`))
    didBackupThisSession = true
    const files = fs.readdirSync(dir)
      .filter((f) => f.startsWith('store-') && f.endsWith('.json'))
      .sort()
    while (files.length > 10) {
      const oldest = files.shift()
      if (oldest) {
        try { fs.unlinkSync(join(dir, oldest)) } catch { /* ignore prune failure */ }
      }
    }
  })

  ipcMain.handle('fs:save-audio', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(audioDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-audio', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(audioDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-audio', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(audioDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  const builtinSoundsDir = app.isPackaged
    ? join(process.resourcesPath, 'sounds')
    : join(app.getAppPath(), 'resources', 'sounds')

  ipcMain.handle('fs:get-builtin-audio', (_, file: string): Uint8Array | null => {
    const p = resolveBuiltinPath(builtinSoundsDir, file)
    return p && fs.existsSync(p) ? fs.readFileSync(p) : null
  })

  ipcMain.handle('fs:save-map-image', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(mapsDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-map-image', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(mapsDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-map-image', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(mapsDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  // JSON export/import: main owns the path (from the native dialog); the renderer never
  // passes a raw filesystem path, so it cannot read/write arbitrary files.
  ipcMain.handle('dialog:save-json', async (_, content: string, opts) => {
    if (!mainWindow || typeof content !== 'string') return { canceled: true }
    const res = await dialog.showSaveDialog(mainWindow, opts)
    if (res.canceled || !res.filePath) return { canceled: true }
    const target = res.filePath.toLowerCase().endsWith('.json') ? res.filePath : `${res.filePath}.json`
    fs.writeFileSync(target, content, 'utf-8')
    return { canceled: false }
  })
  ipcMain.handle('dialog:open-json', async (_, opts) => {
    if (!mainWindow) return { canceled: true, content: null }
    const res = await dialog.showOpenDialog(mainWindow, { ...opts, properties: ['openFile'] })
    if (res.canceled || res.filePaths.length === 0) return { canceled: true, content: null }
    const p = res.filePaths[0]
    if (!p.toLowerCase().endsWith('.json')) return { canceled: false, content: null }
    try { return { canceled: false, content: fs.readFileSync(p, 'utf-8') } }
    catch { return { canceled: false, content: null } }
  })

  ipcMain.handle('player:get-displays', () =>
    screen.getAllDisplays().map((d, i) => ({
      index: i,
      label: `Display ${i + 1}  ${d.bounds.width}×${d.bounds.height}`,
      isPrimary: d.id === screen.getPrimaryDisplay().id,
    }))
  )
  ipcMain.on('player:open', (_, displayIndex?: number) => createPlayerWindow(displayIndex))
  ipcMain.on('player:close', () => {
    if (playerWin && !playerWin.isDestroyed()) playerWin.close()
  })
  ipcMain.on('player:set-map', (_, storedId: string) => {
    pendingMapId = storedId
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-map', storedId)
    }
  })
  ipcMain.on('player:clear-map', () => {
    pendingMapId = null
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:clear-map')
    }
  })
  ipcMain.on('player:ready', () => {
    if (!playerWin || playerWin.isDestroyed()) return
    if (pendingMapId) playerWin.webContents.send('player:set-map', pendingMapId)
    if (pendingFog) playerWin.webContents.send('player:set-fog', pendingFog)
    if (pendingViewport) playerWin.webContents.send('player:set-viewport', pendingViewport)
    playerWin.webContents.send('player:set-rotation', pendingRotation)
    playerWin.webContents.send('player:set-initiative', pendingInitiative)
  })
  ipcMain.on('player:set-initiative', (_, payload: unknown) => {
    pendingInitiative = payload
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-initiative', payload)
    }
  })
  ipcMain.on('player:set-rotation', (_, rotation: 0 | 90) => {
    pendingRotation = rotation === 90 ? 90 : 0
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-rotation', pendingRotation)
    }
  })
  ipcMain.on('player:show-overlay', (_, storedId: string, name: string) => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:show-overlay', storedId, name)
    }
  })
  ipcMain.on('player:clear-overlay', () => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:clear-overlay')
    }
  })
  ipcMain.on('player:set-campaign-map', (_, storedId: string) => {
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-campaign-map', storedId)
    }
  })
  ipcMain.on('player:set-fog', (_, zones: unknown) => {
    if (!Array.isArray(zones)) return
    pendingFog = zones
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-fog', zones)
    }
  })
  ipcMain.on('player:set-viewport', (_, viewport: { offsetX: number; offsetY: number; scale: number }) => {
    pendingViewport = viewport
    if (playerWin && !playerWin.isDestroyed()) {
      playerWin.webContents.send('player:set-viewport', viewport)
    }
  })
  ipcMain.handle('player:is-open', () => playerWin !== null && !playerWin.isDestroyed())
  ipcMain.handle('player:get-window-bounds', () => {
    if (!playerWin || playerWin.isDestroyed()) return null
    const { width, height } = playerWin.getBounds()
    return { width, height }
  })

  ipcMain.handle('player:capture-map', async (_, rect: { x: number; y: number; width: number; height: number }) => {
    if (!mainWindow || mainWindow.isDestroyed() || !playerWin || playerWin.isDestroyed()) return
    const image = await mainWindow.webContents.capturePage(rect)
    fs.writeFileSync(join(playerScreenDir, 'campaign-map-snapshot'), image.toPNG())
    playerWin.webContents.send('player:show-overlay', 'campaign-map-snapshot', 'Campaign Map')
  })

  ipcMain.handle('fs:save-player-image', (_, id: string, data: Uint8Array) => {
    if (!SAFE_ID_RE.test(id)) return
    fs.writeFileSync(join(playerScreenDir, id), Buffer.from(data))
  })
  ipcMain.handle('fs:get-player-image', (_, id: string): Uint8Array | null => {
    if (!SAFE_ID_RE.test(id)) return null
    const p = join(playerScreenDir, id)
    return fs.existsSync(p) ? fs.readFileSync(p) : null
  })
  ipcMain.handle('fs:delete-player-image', (_, id: string) => {
    if (!SAFE_ID_RE.test(id)) return
    const p = join(playerScreenDir, id)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })

  ipcMain.handle('vault:pick-folder', async (): Promise<string | null> => {
    if (!mainWindow) return null
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
    if (res.canceled || res.filePaths.length === 0) return null
    vaultRoot = res.filePaths[0]
    persistVaultRoot(vaultRoot)
    return vaultRoot
  })

  ipcMain.handle('vault:read-tree', (_, root: string): VaultNodeShape | null => {
    if (typeof root !== 'string' || !fs.existsSync(root)) return null
    try {
      if (!fs.statSync(root).isDirectory()) return null
    } catch {
      return null
    }
    // Harden: only serve the remembered vault root. Trust-on-first-use when none is
    // remembered yet (e.g. installs from before the root was persisted).
    if (vaultRoot && root !== vaultRoot) return null
    if (!vaultRoot) { vaultRoot = root; persistVaultRoot(root) }
    return buildVaultTree(root, root)
  })

  ipcMain.handle('vault:read-file', (_, rel: string): string | null => {
    if (!vaultRoot || typeof rel !== 'string') return null
    const abs = path.resolve(vaultRoot, rel)
    if (!isInsideRoot(vaultRoot, abs) || path.extname(abs).toLowerCase() !== '.md') return null
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null
  })

  ipcMain.handle('vault:read-image', (_, rel: string): Uint8Array | null => {
    if (!vaultRoot || typeof rel !== 'string') return null
    const abs = path.resolve(vaultRoot, rel)
    if (!isInsideRoot(vaultRoot, abs) || !isAllowedVaultImageExtension(path.extname(abs))) return null
    return fs.existsSync(abs) ? fs.readFileSync(abs) : null
  })

  ipcMain.handle('vault:search', (_, query: string): VaultSearchResult[] => {
    if (!vaultRoot || typeof query !== 'string') return []
    return searchVault(vaultRoot, query)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
import { vi } from 'vitest'

// Los stores persistidos llaman a window.electron.store al hidratar (durante el import).
// En Node no existe window; lo stubbeamos con no-ops. Con get→null no hay estado
// persistido, así que persist usa el estado inicial y no dispara migrate/backup.
vi.stubGlobal('window', {
    electron: {
        store: {
            get: () => Promise.resolve(null),
            set: () => {},
            delete: () => {},
            backup: () => Promise.resolve(),
        },
    },
})

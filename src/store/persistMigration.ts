// Marco de migración para stores persistidos con Zustand.
//
// Convención: al cambiar la FORMA de un store, sube su `version` a N en las
// opciones de `persist` y añade `steps[N] = (state) => …` con la transformación
// que lleva de la versión N-1 a la N. `createMigrate` respalda `store.json` antes
// de aplicar cualquier migración (Zustand solo invoca `migrate` cuando la versión
// persistida difiere de la actual).
//
// OJO: en stores que usan `partialize` (p.ej. musicStore, soundboardStore), el
// `state` que recibe un `step` es SOLO el subconjunto persistido, no el estado
// completo del store. Escribe las migraciones de esos stores pensando en esa forma.

export type MigrationStep = (state: unknown) => unknown
// clave = versión DESTINO del paso
export type MigrationSteps = Record<number, MigrationStep>

export function applyMigrations(
    state: unknown,
    fromVersion: number,
    currentVersion: number,
    steps: MigrationSteps,
): unknown {
    let s = state
    for (let v = fromVersion + 1; v <= currentVersion; v++) {
        const step = steps[v]
        if (step) s = step(s)
    }
    return s
}

export function createMigrate<S>(currentVersion: number, steps: MigrationSteps) {
    return async (persisted: unknown, fromVersion: number): Promise<S> => {
        try {
            if (typeof window !== 'undefined') await window.electron.store.backup()
        } catch {
            // Un fallo de backup no debe bloquear la migración.
        }
        return applyMigrations(persisted, fromVersion, currentVersion, steps) as S
    }
}

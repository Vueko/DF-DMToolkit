// Resolución segura de sonidos incluidos (resources/sounds). Lógica pura, testeable sin Electron.
import { resolve, sep } from 'node:path'

export const BUILTIN_FILE_RE = /^[a-z0-9-]+\.(ogg|mp3)$/

export function resolveBuiltinPath(dir: string, file: unknown): string | null {
  if (typeof file !== 'string' || !BUILTIN_FILE_RE.test(file)) return null
  const base = resolve(dir)
  const p = resolve(base, file)
  return p.startsWith(base + sep) ? p : null
}

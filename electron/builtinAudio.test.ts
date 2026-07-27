import { describe, it, expect } from 'vitest'
import { sep } from 'node:path'
import { resolveBuiltinPath } from './builtinAudio'

const DIR = sep === '\\' ? 'C:\\app\\resources\\sounds' : '/app/resources/sounds'

describe('resolveBuiltinPath', () => {
  it('acepta nombres válidos ogg/mp3', () => {
    expect(resolveBuiltinPath(DIR, 'rain.ogg')).toContain('rain.ogg')
    expect(resolveBuiltinPath(DIR, 'sword-clash.mp3')).toContain('sword-clash.mp3')
  })
  it('rechaza traversal, extensiones y tipos inválidos', () => {
    expect(resolveBuiltinPath(DIR, '../store.json')).toBeNull()
    expect(resolveBuiltinPath(DIR, 'a/b.ogg')).toBeNull()
    expect(resolveBuiltinPath(DIR, 'rain.wav')).toBeNull()
    expect(resolveBuiltinPath(DIR, 'RAIN.OGG')).toBeNull()
    expect(resolveBuiltinPath(DIR, 42)).toBeNull()
    expect(resolveBuiltinPath(DIR, undefined)).toBeNull()
  })
  it('el path resuelto queda contenido en el directorio', () => {
    const p = resolveBuiltinPath(DIR, 'rain.ogg')
    expect(p?.startsWith(DIR + sep)).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { BUILTIN_SOUNDS, BUILTIN_FILE_RE } from './builtinSounds'
import { SOUND_ICONS } from '../components/audio/soundIcons'
import { translations } from '../i18n'

const __dirname = dirname(fileURLToPath(import.meta.url))
const soundsDir = join(__dirname, '..', '..', 'resources', 'sounds')

describe('BUILTIN_SOUNDS manifest', () => {
    it('ids únicos con prefijo builtin-', () => {
        const ids = BUILTIN_SOUNDS.map((b) => b.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) expect(id).toMatch(/^builtin-[a-z0-9-]+$/)
    })
    it('tipos válidos e iconos existentes', () => {
        for (const b of BUILTIN_SOUNDS) {
            expect(['oneshot', 'ambient']).toContain(b.type)
            expect(SOUND_ICONS[b.icon], `icono ${b.icon} de ${b.id}`).toBeDefined()
        }
    })
    it('cada archivo cumple la regex y existe en resources/sounds', () => {
        for (const b of BUILTIN_SOUNDS) {
            expect(b.file, b.id).toMatch(BUILTIN_FILE_RE)
            expect(fs.existsSync(join(soundsDir, b.file)), `${b.file} no existe`).toBe(true)
        }
    })
    it('cada archivo de resources/sounds está en el manifest', () => {
        const audioFiles = fs.readdirSync(soundsDir).filter((f: string) => BUILTIN_FILE_RE.test(f))
        const manifestFiles = new Set(BUILTIN_SOUNDS.map((b) => b.file))
        for (const f of audioFiles) expect(manifestFiles.has(f), `${f} sin entrada en el manifest`).toBe(true)
    })
    it('nameKey traducido en EN y ES', () => {
        for (const b of BUILTIN_SOUNDS) {
            expect((translations.en as Record<string, string>)[b.nameKey], `${b.nameKey} (en)`).toBeTruthy()
            expect((translations.es as Record<string, string>)[b.nameKey], `${b.nameKey} (es)`).toBeTruthy()
        }
    })
    it('el pack incluido es solo de ambientes (sin one-shots), al menos 6', () => {
        expect(BUILTIN_SOUNDS.filter((b) => b.type === 'ambient').length).toBeGreaterThanOrEqual(6)
        expect(BUILTIN_SOUNDS.filter((b) => b.type === 'oneshot').length).toBe(0)
    })
})

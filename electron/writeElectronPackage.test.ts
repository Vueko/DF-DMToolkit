import { describe, expect, it } from 'vitest'
import { createRequire } from 'module'
import * as fs from 'fs'
import * as os from 'os'
import { join } from 'path'

const require = createRequire(import.meta.url)
const { writeElectronPackage } = require('../scripts/write-electron-package.cjs') as {
    writeElectronPackage: (outDir?: string) => void
}

describe('writeElectronPackage', () => {
    it('marks dist-electron as CommonJS for packaged Electron entry files', () => {
        const outDir = fs.mkdtempSync(join(os.tmpdir(), 'electron-package-'))

        writeElectronPackage(outDir)

        expect(JSON.parse(fs.readFileSync(join(outDir, 'package.json'), 'utf8'))).toEqual({
            type: 'commonjs',
        })
    })
})


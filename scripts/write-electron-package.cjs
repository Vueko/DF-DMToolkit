const fs = require('fs')
const path = require('path')

function writeElectronPackage(outDir = path.join(process.cwd(), 'dist-electron')) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, 'package.json'),
    `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
    'utf8',
  )
}

if (require.main === module) {
  writeElectronPackage()
}

module.exports = { writeElectronPackage }

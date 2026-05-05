/**
 * Registra .githooks como hooksPath (post-commit para DATABASE_CHANGES.md).
 * Se ejecuta desde npm run prepare.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')

if (!fs.existsSync(path.join(root, '.git'))) {
  process.exit(0)
}

try {
  execSync('git config core.hooksPath .githooks', { cwd: root, stdio: 'ignore' })
} catch {
  process.exit(0)
}

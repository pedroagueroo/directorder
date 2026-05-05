/**
 * Called from .githooks/post-commit. Appends to docs/DATABASE_CHANGES.md when
 * the last commit touches database-related files.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const CHANGELOG = path.join(ROOT, 'docs', 'DATABASE_CHANGES.md')

const DB_PATH_TESTS = [
  /^scripts\/.*\.sql$/i,
  /^scripts\/setup-supabase\.js$/,
  /^scripts\/seed-supabase\.js$/,
  /^scripts\/migrate.*\.js$/,
]

function normalizePath(p) {
  return p.replace(/\\/g, '/')
}

function getTrackedDbFiles(files) {
  return files.filter((f) => {
    const n = normalizePath(f)
    return DB_PATH_TESTS.some((re) => re.test(n))
  })
}

function git(args) {
  return execSync(`git ${args}`, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function main() {
  let hash
  let short
  let subject
  let files

  try {
    hash = git('rev-parse HEAD')
    short = git('rev-parse --short HEAD')
    subject = git('log -1 --format=%s')
    files = git('diff-tree --no-commit-id --name-only -r HEAD')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    process.exit(0)
  }

  const dbFiles = getTrackedDbFiles(files)
  if (dbFiles.length === 0) {
    process.exit(0)
  }

  if (!fs.existsSync(CHANGELOG)) {
    process.stderr.write(`append-database-changelog: missing ${CHANGELOG}\n`)
    process.exit(1)
  }

  let body = fs.readFileSync(CHANGELOG, 'utf8')
  const marker = '<!-- ENTRIES_END -->'
  const idx = body.indexOf(marker)
  if (idx === -1) {
    process.stderr.write('append-database-changelog: marker ENTRIES_END not found\n')
    process.exit(1)
  }

  // Evitar duplicar si se re-ejecuta el hook sobre el mismo commit
  if (body.includes(`commit \`${short}\``)) {
    process.exit(0)
  }

  const iso = new Date().toISOString().slice(0, 19) + 'Z'
  const block = `
### ${iso} — commit \`${short}\` (\`${hash.slice(0, 7)}\`)

**Mensaje:** ${subject}

**Archivos (DB / migraciones):**

${dbFiles.map((f) => `- \`${normalizePath(f)}\``).join('\n')}

**Para Supabase:** revisar el diff de esos archivos y ejecutar en el SQL Editor lo que corresponda (especialmente \`.sql\`).

---

`

  const newBody = body.slice(0, idx) + block + body.slice(idx)
  fs.writeFileSync(CHANGELOG, newBody, 'utf8')

  try {
    execSync(`git add docs/DATABASE_CHANGES.md`, { cwd: ROOT, stdio: 'ignore' })
    process.stderr.write(
      '\n[DirectOrder] docs/DATABASE_CHANGES.md actualizado y en staging. ' +
        'Incluílo en el repo: git commit --amend --no-edit --no-verify\n' +
        '(o hacé un commit aparte solo para el changelog).\n\n'
    )
  } catch {
    process.stderr.write('\n[DirectOrder] docs/DATABASE_CHANGES.md actualizado (agregalo con git add).\n\n')
  }
}

main()

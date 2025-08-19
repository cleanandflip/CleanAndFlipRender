#!/usr/bin/env node
/**
 * Merge Check Script
 * Usage: node scripts/merge-check.mjs /path/to/your-existing-repo
 * Scans for common issues before merging into CleanFlipRender.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
if (!root) {
  console.error('Usage: node scripts/merge-check.mjs <path-to-source-repo>')
  process.exit(1)
}

const findings = {
  server: {
    bindProcessEnvPort: false,
    bindHost0000: false,
    hasHealthz: false,
    setsCookieSameSiteNone: false,
    usesWebSocketCustomPort: false
  },
  client: {
    usesProcessEnvDirectly: false,
    usesViteEnvPrefix: false,
    hasViteAliasAt: false
  },
  repo: {
    hasClientDir: false,
    hasServerDir: false
  },
  notes: []
}

function walk(dir, out=[]) {
  const ents = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of ents) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function read(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return '' }
}

const files = walk(root)
for (const file of files) {
  const txt = read(file)
  const lower = txt.toLowerCase()

  if (file.match(/server|api|index\.ts|app\.ts|main\.ts|express/i)) {
    if (txt.match(/process\.env\.PORT/)) findings.server.bindProcessEnvPort = true
    if (txt.includes('0.0.0.0')) findings.server.bindHost0000 = true
    if (lower.includes('/healthz')) findings.server.hasHealthz = true
    if (lower.includes('sameSite') && lower.includes('none')) findings.server.setsCookieSameSiteNone = true
    if (lower.includes('ws://') || lower.includes(':100')) findings.server.usesWebSocketCustomPort = true
  }

  if (file.match(/\/client\/|\/web\/|vite|react|\.tsx?$|\.jsx?$/i)) {
    if (txt.match(/process\.env\./)) findings.client.usesProcessEnvDirectly = true
    if (txt.match(/import\.meta\.env\.VITE_/)) findings.client.usesViteEnvPrefix = true
    if (txt.match(/alias\s*:\s*{[^}]*['"]@['"]\s*:/s)) findings.client.hasViteAliasAt = true
  }

  if (file.includes('client')) findings.repo.hasClientDir = true
  if (file.includes('server')) findings.repo.hasServerDir = true
}

console.log('\n=== Merge Check Report ===\n')
console.log(JSON.stringify(findings, null, 2))

if (!findings.server.bindProcessEnvPort) {
  findings.notes.push('Server does not bind process.env.PORT; required on Render.')
}
if (!findings.server.bindHost0000) {
  findings.notes.push('Server may not bind 0.0.0.0; add host to app.listen on Render.')
}
if (!findings.server.hasHealthz) {
  findings.notes.push('Add GET /healthz route for Render health checks.')
}
if (findings.server.usesWebSocketCustomPort) {
  findings.notes.push('WebSocket must share the main HTTP port on Render (no custom port).')
}
if (findings.client.usesProcessEnvDirectly && !findings.client.usesViteEnvPrefix) {
  findings.notes.push('Client uses process.env directly; switch to import.meta.env.VITE_* variables.')
}
if (!findings.client.hasViteAliasAt) {
  findings.notes.push('Add Vite alias @ → src to keep imports clean.')
}

if (findings.notes.length) {
  console.log('\nNotes:')
  for (const n of findings.notes) console.log('- ' + n)
} else {
  console.log('\nNo blockers detected. Ready to merge.')
}

#!/usr/bin/env node
/**
 * Materialize hosts/<style>/public from the shared root public/ tree.
 *
 * Host public/ folders are gitignored so the root publish-app pack stays under
 * the 50MB limit (duplicated style assets were the overrun). Run this before
 * local host vite / publish-app for hosts/pixel|vintage|paper|neon.
 */
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const styles = ['pixel', 'vintage', 'paper', 'neon']
const shared = ['guides', 'effects', 'favicon.svg']

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = only.length ? only : styles

for (const style of targets) {
  if (!styles.includes(style)) {
    console.error(`Unknown style: ${style}`)
    process.exit(1)
  }
  const hostPublic = join(root, 'hosts', style, 'public')
  const styleSrc = join(root, 'public', style)
  if (!existsSync(styleSrc)) {
    console.error(`Missing root assets: ${styleSrc}`)
    process.exit(1)
  }
  rmSync(hostPublic, { recursive: true, force: true })
  mkdirSync(hostPublic, { recursive: true })
  cpSync(styleSrc, join(hostPublic, style), { recursive: true })
  for (const name of shared) {
    const src = join(root, 'public', name)
    if (!existsSync(src)) continue
    const dest = join(hostPublic, name)
    cpSync(src, dest, { recursive: true })
  }
  console.log(`synced hosts/${style}/public ← public/${style} + shared`)
}

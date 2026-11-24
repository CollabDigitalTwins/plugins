// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { findPlugins, repoPath } from './pluginFiles.mjs'

const NOT_SOURCE = new Set(['node_modules', 'dist', '.git'])
const FORCE = process.argv.includes('--force')

function npm(args, cwd) {
  return spawnSync('npm', args, { cwd, stdio: 'inherit', shell: true }).status === 0
}

function mtime(path) {
  return existsSync(path) ? statSync(path).mtimeMs : 0
}

function newestSourceMtime(dir) {
  const times = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !NOT_SOURCE.has(entry.name))
    .map((entry) => {
      const path = join(dir, entry.name)
      return entry.isDirectory() ? newestSourceMtime(path) : mtime(path)
    })
  return Math.max(0, ...times)
}

function hasLockfile(dir) {
  return existsSync(join(dir, 'package-lock.json'))
}

// npm writes node_modules/.package-lock.json on every install, so it dates the last one.
function lastInstallMtime(dir) {
  return mtime(join(dir, 'node_modules', '.package-lock.json')) || mtime(join(dir, 'node_modules'))
}

function needsInstall(dir) {
  const manifest = join(dir, hasLockfile(dir) ? 'package-lock.json' : 'package.json')
  return !existsSync(join(dir, 'node_modules')) || mtime(manifest) > lastInstallMtime(dir)
}

function install(dir) {
  const args = hasLockfile(dir) ? ['ci'] : ['install', '--no-package-lock']
  return npm([...args, '--no-audit', '--no-fund'], dir)
}

function needsBuild(dir) {
  return FORCE || needsInstall(dir) || newestSourceMtime(dir) > mtime(join(dir, 'dist', 'index.js'))
}

function buildPlugin(dir) {
  if (needsInstall(dir) && !install(dir)) return false
  return npm(['run', 'build'], dir)
}

const plugins = findPlugins()
const stale = plugins.filter(needsBuild)
const failed = []

for (const dir of stale) {
  const name = repoPath(dir)
  console.log(`\n▶ ${name}`)
  if (!buildPlugin(dir)) failed.push(name)
}

console.log(`\nBuilt ${stale.length - failed.length}/${stale.length} plugins, ${plugins.length - stale.length} already up to date.`)
if (failed.length > 0) {
  console.error(`Failed:\n${failed.map((name) => `  ✖ ${name}`).join('\n')}`)
  process.exit(1)
}

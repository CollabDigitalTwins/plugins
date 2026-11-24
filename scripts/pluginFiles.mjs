// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export const REPO_ROOT = join(import.meta.dirname, '..')
export const PLUGINS_ROOT = join(REPO_ROOT, 'plugins')
const SKIPPED_FOLDERS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage'])

// Mirrors the CDT loader: a manifest.json marks a plugin, and nothing inside a plugin is searched.
export function findPlugins(dir = PLUGINS_ROOT) {
  if (existsSync(join(dir, 'manifest.json'))) return [dir]
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !SKIPPED_FOLDERS.has(entry.name))
    .flatMap((entry) => findPlugins(join(dir, entry.name)))
}

export function repoPath(absolutePath) {
  return relative(REPO_ROOT, absolutePath).split(sep).join('/')
}

export function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

export function changedFilesSince(base) {
  return git(['diff', '--name-only', `${base}...HEAD`]).split('\n').filter(Boolean)
}

export function filesUnder(pluginPath, files) {
  return files.filter((file) => file.startsWith(`${pluginPath}/`))
}

export function readFlag(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

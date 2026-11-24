// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { changedFilesSince, filesUnder, findPlugins, git, readFlag, repoPath } from './pluginFiles.mjs'

// Mirrors validateManifest in @collabdt/core and validatePublish in cdt-na; update all three together.
const VALID_CAPABILITIES = new Set(['data.pages', 'viewer.tabs', 'ui.dialogs', 'map.tools', 'bim.tools', 'viewer.legends', 'map.layers', 'map.datasets'])
const RESERVED_SLUGS = new Set(['registry', 'mounted', 'installations', 'user-settings', 'hello-map', 'hello-bim'])
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const HOST_API = 1
const MAX_BUNDLE_BYTES = 5 * 1024 * 1024
const LICENSE = 'AGPL-3.0-or-later'
const INSTALL_HOOKS = ['preinstall', 'install', 'postinstall', 'prepare']
const FOREIGN_LOCKFILES =['yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']
const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/
const SPDX_HEADER = /SPDX-License-Identifier:/
const SPDX_SEARCH_LINES = 5
const DOCS_ONLY = /\.md$/i
const FORBIDDEN_TRACKED = [
  { pattern: /(^|\/)node_modules\//, reason: 'dependencies are installed, never committed' },
  { pattern: /(^|\/)dist\//, reason: 'build output is never committed' },
  { pattern: /(^|\/)\.env(\.(?!example$)[^/]+)?$/, reason: 'environment files can hold secrets' },
]

function parseVersion(version) {
  const match = SEMVER.exec(String(version).trim())
  if (!match) return null
  return { core: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: match[4] ? match[4].split('.') : [] }
}

function compareIdentifiers(a, b) {
  const aNumeric = /^\d+$/.test(a)
  const bNumeric = /^\d+$/.test(b)
  if (aNumeric && bNumeric) return Number(a) - Number(b)
  if (aNumeric) return -1
  if (bNumeric) return 1
  return a < b ? -1 : a > b ? 1 : 0
}

function comparePrerelease(a, b) {
  if (a.length === 0 || b.length === 0) return b.length - a.length
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    if (a[index] === undefined) return -1
    if (b[index] === undefined) return 1
    const order = compareIdentifiers(a[index], b[index])
    if (order !== 0) return order
  }
  return 0
}

/** Negative when `a` is older than `b`, positive when newer; invalid versions sort first. */
export function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!left || !right) return (left ? 1 : 0) - (right ? 1 : 0)
  for (let index = 0; index < 3; index++) {
    const order = left.core[index] - right.core[index]
    if (order !== 0) return order
  }
  return comparePrerelease(left.prerelease, right.prerelease)
}

function checkSlug(slug) {
  if (typeof slug !== 'string' || !slug) return ['slug is required']
  if (slug.length > 64 || !SLUG.test(slug)) return [`slug "${slug}" must be lowercase letters, digits and single hyphens (max 64)`]
  if (RESERVED_SLUGS.has(slug)) return [`slug "${slug}" is reserved; choose another`]
  return []
}

function checkCapabilities(capabilities) {
  if (!Array.isArray(capabilities) || capabilities.length === 0) return ['at least one capability is required']
  const errors = capabilities
    .filter((capability) => !VALID_CAPABILITIES.has(capability))
    .map((capability) => `unknown capability "${capability}" (valid: ${[...VALID_CAPABILITIES].join(', ')})`)
  const repeated = capabilities.filter((capability, index) => capabilities.indexOf(capability) !== index)
  return [...errors, ...repeated.map((capability) => `capability "${capability}" is listed twice`)]
}

function checkManifest(manifest, segments) {
  const errors = [...checkSlug(manifest.slug), ...checkCapabilities(manifest.capabilities)]
  if (typeof manifest.name !== 'string' || !manifest.name) errors.push('name is required')
  if (!parseVersion(manifest.version)) errors.push(`version "${manifest.version}" is not semver (e.g. 1.2.0)`)
  if (manifest.hostApi !== HOST_API) errors.push(`hostApi must be ${HOST_API}, got ${String(manifest.hostApi)}`)
  if (manifest.category !== segments[1]) errors.push(`category must be "${segments[1]}" to match its folder, got "${String(manifest.category)}"`)
  if (manifest.messages !== undefined && typeof manifest.messages?.en !== 'object') errors.push('messages must include an "en" locale')
  return errors
}

function checkPackage(pkg, manifest) {
  if (!pkg) return ['package.json is missing']
  const errors = []
  if (pkg.version !== manifest.version) errors.push(`package.json version ${pkg.version} differs from manifest version ${manifest.version}`)
  if (pkg.private !== true) errors.push('package.json must set "private": true so it is never published to npm by accident')
  if (pkg.license !== LICENSE) errors.push(`package.json license must be "${LICENSE}"`)
  if (!pkg.scripts?.build) errors.push('package.json needs a "build" script')
  for (const hook of INSTALL_HOOKS.filter((name) => pkg.scripts?.[name])) errors.push(`package.json must not define a "${hook}" script; installing a plugin never runs code`)
  return errors
}

function checkFiles(files, tsupConfig, sourcesWithoutSpdx) {
  const errors = []
  if (!files.has('README.md')) errors.push('README.md is missing')
  if (!files.has('package-lock.json')) errors.push('package-lock.json is missing; run npm install and commit it')
  for (const lockfile of FOREIGN_LOCKFILES.filter((name) => files.has(name))) errors.push(`${lockfile} found; this repository uses npm, remove it`)
  if (tsupConfig === null) errors.push('tsup.config.ts is missing')
  else if (!tsupConfig.includes('pluginPreset')) errors.push('tsup.config.ts must build with pluginPreset() from @collabdt/plugin-kit')
  for (const file of sourcesWithoutSpdx) errors.push(`${file} has no SPDX-License-Identifier header`)
  return errors
}

/** Every rule one plugin folder must pass; `plugin` is plain data so this stays pure. */
export function checkPlugin({ path, manifest, pkg, files, tsupConfig, sourcesWithoutSpdx }) {
  const segments = path.split('/')
  const errors = []
  if (segments.length < 3 || segments.length > 4) errors.push('a plugin sits at plugins/<category>/<plugin> or one project folder deep, never deeper')
  errors.push(...checkManifest(manifest, segments), ...checkPackage(pkg, manifest), ...checkFiles(files, tsupConfig, sourcesWithoutSpdx))
  return errors.map((error) => `${path}: ${error}`)
}

export function checkVersionBump(path, manifest, previous, changedFiles) {
  if (!previous) return []
  if (previous.slug !== manifest.slug) return [`${path}: slug changed from "${previous.slug}"; a slug is the plugin's identity, so a new slug is a new plugin in a new folder`]
  const codeChanged = filesUnder(path, changedFiles).some((file) => !DOCS_ONLY.test(file))
  if (codeChanged && compareVersions(manifest.version, previous.version) <= 0) {
    return [`${path}: changed but its version is still ${manifest.version}; bump it above ${previous.version} in manifest.json and package.json`]
  }
  return []
}

export function findDuplicateSlugs(plugins) {
  const bySlug = Map.groupBy(plugins, (plugin) => plugin.manifest.slug)
  return [...bySlug].filter(([, owners]) => owners.length > 1)
    .map(([slug, owners]) => `slug "${slug}" is used by ${owners.map((owner) => owner.path).join(' and ')}; the platform skips both`)
}

export function findForbiddenTrackedFiles(trackedFiles) {
  return trackedFiles.flatMap((file) => FORBIDDEN_TRACKED.filter(({ pattern }) => pattern.test(file)).map(({ reason }) => `${file} is tracked: ${reason}`))
}

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
}

function sourceFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && SOURCE_FILE.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
}

function hasSpdxHeader(file) {
  return readFileSync(file, 'utf8').split('\n', SPDX_SEARCH_LINES).some((line) => SPDX_HEADER.test(line))
}

function readPlugin(dir) {
  const path = repoPath(dir)
  const tsupPath = join(dir, 'tsup.config.ts')
  return {
    dir,
    path,
    manifest: readJson(join(dir, 'manifest.json')),
    pkg: readJson(join(dir, 'package.json')),
    files: new Set(readdirSync(dir)),
    tsupConfig: existsSync(tsupPath) ? readFileSync(tsupPath, 'utf8') : null,
    sourcesWithoutSpdx: sourceFiles(join(dir, 'src')).filter((file) => !hasSpdxHeader(file)).map((file) => repoPath(file).slice(path.length + 1)),
  }
}

function manifestAt(ref, path) {
  try {
    return JSON.parse(git(['show', `${ref}:${path}/manifest.json`]))
  } catch {
    return undefined
  }
}

function checkBundle({ dir, path }) {
  const bundle = join(dir, 'dist', 'index.js')
  if (!existsSync(bundle)) return [`${path}: dist/index.js is missing; run npm run build`]
  const bytes = statSync(bundle).size
  return bytes > MAX_BUNDLE_BYTES ? [`${path}: dist/index.js is ${bytes} bytes; the registry limit is ${MAX_BUNDLE_BYTES}`] : []
}

function main() {
  const base = readFlag('--base')
  const built = process.argv.includes('--built')
  const plugins = findPlugins().map(readPlugin)
  const changed = base ? changedFilesSince(base) : []

  const errors = [
    ...findForbiddenTrackedFiles(git(['ls-files']).split('\n').filter(Boolean)),
    ...plugins.flatMap((plugin) => {
      try {
        return checkPlugin(plugin)
      } catch (error) {
        return [`${plugin.path}: could not be checked (${error.message})`]
      }
    }),
    ...findDuplicateSlugs(plugins.filter((plugin) => plugin.manifest)),
    ...(base ? plugins.flatMap((plugin) => checkVersionBump(plugin.path, plugin.manifest, manifestAt(base, plugin.path), changed)) : []),
    ...(built ? plugins.flatMap(checkBundle) : []),
  ]

  if (errors.length > 0) {
    console.error(`✖ ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n${errors.map((error) => `  - ${error}`).join('\n')}`)
    process.exit(1)
  }
  console.log(`✔ ${plugins.length} plugin${plugins.length === 1 ? '' : 's'} valid${base ? ` (versions checked against ${base})` : ''}${built ? ', bundles within limits' : ''}`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()

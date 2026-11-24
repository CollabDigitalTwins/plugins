// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { checkPlugin, checkVersionBump, compareVersions, findDuplicateSlugs, findForbiddenTrackedFiles } from './validatePlugins.mjs'

const PATH = 'plugins/live-data/example'

function validPlugin(overrides = {}) {
  return {
    path: PATH,
    manifest: {
      slug: 'example',
      name: 'Example',
      version: '1.2.0',
      hostApi: 1,
      category: 'live-data',
      capabilities: ['map.layers'],
      messages: { en: { title: 'Example' } },
    },
    pkg: { version: '1.2.0', private: true, license: 'AGPL-3.0-or-later', scripts: { build: 'tsup' } },
    files: new Set(['README.md', 'package-lock.json', 'tsup.config.ts', 'manifest.json', 'package.json']),
    tsupConfig: "import { pluginPreset } from '@collabdt/plugin-kit'\nexport default pluginPreset()",
    sourcesWithoutSpdx: [],
    ...overrides,
  }
}

function withManifest(changes) {
  const plugin = validPlugin()
  return { ...plugin, manifest: { ...plugin.manifest, ...changes } }
}

describe('checkPlugin', () => {
  it('accepts a valid plugin', () => {
    assert.deepEqual(checkPlugin(validPlugin()), [])
  })

  it('rejects a lockfile that only lists the optional binaries for one platform', () => {
    const lockfile = { packages: { 'node_modules/rollup': { optionalDependencies: { '@rollup/rollup-linux-x64-gnu': '4.0.0', '@rollup/rollup-win32-x64-msvc': '4.0.0' } }, 'node_modules/@rollup/rollup-win32-x64-msvc': {} } }
    assert.ok(checkPlugin(validPlugin({ lockfile })).some(error => error.includes('@rollup/rollup-linux-x64-gnu')))
    lockfile.packages['node_modules/@rollup/rollup-linux-x64-gnu'] = {}
    assert.deepEqual(checkPlugin(validPlugin({ lockfile })), [])
  })

  it('rejects slugs the platform rejects', () => {
    for (const slug of ['Example', 'two--hyphens', '-leading', 'a'.repeat(65), 'registry', 'hello-map']) {
      assert.ok(checkPlugin(withManifest({ slug })).some(error => error.includes('slug')), slug)
    }
  })

  it('requires hostApi 1', () => {
    assert.ok(checkPlugin(withManifest({ hostApi: undefined })).some(error => error.includes('hostApi')))
    assert.ok(checkPlugin(withManifest({ hostApi: 2 })).some(error => error.includes('hostApi')))
  })

  it('rejects a version that is not semver', () => {
    assert.ok(checkPlugin(withManifest({ version: '1.2' })).some(error => error.includes('semver')))
  })

  it('rejects unknown, duplicate and missing capabilities', () => {
    assert.ok(checkPlugin(withManifest({ capabilities: ['map.everything'] })).some(error => error.includes('map.everything')))
    assert.ok(checkPlugin(withManifest({ capabilities: ['map.layers', 'map.layers'] })).some(error => error.includes('twice')))
    assert.ok(checkPlugin(withManifest({ capabilities: [] })).some(error => error.includes('capability')))
  })

  it('requires the category to match the folder', () => {
    assert.ok(checkPlugin(withManifest({ category: 'utilities' })).some(error => error.includes('category')))
  })

  it('accepts a plugin nested one project folder deep, and nothing deeper', () => {
    assert.deepEqual(checkPlugin({ ...validPlugin(), path: 'plugins/live-data/project/example' }), [])
    assert.ok(checkPlugin({ ...validPlugin(), path: 'plugins/live-data/a/b/example' }).some(error => error.includes('deep')))
  })

  it('requires English messages when messages are present', () => {
    assert.ok(checkPlugin(withManifest({ messages: { fr: {} } })).some(error => error.includes('en')))
    assert.deepEqual(checkPlugin(withManifest({ messages: undefined })), [])
  })

  it('requires package.json to agree with the manifest', () => {
    const plugin = validPlugin()
    const errors = checkPlugin({ ...plugin, pkg: { ...plugin.pkg, version: '1.1.0', private: false, license: 'MIT' } })
    assert.ok(errors.some(error => error.includes('1.1.0')))
    assert.ok(errors.some(error => error.includes('private')))
    assert.ok(errors.some(error => error.includes('license')))
  })

  it('refuses install-time lifecycle scripts', () => {
    const plugin = validPlugin()
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
      const errors = checkPlugin({ ...plugin, pkg: { ...plugin.pkg, scripts: { ...plugin.pkg.scripts, [hook]: 'node x.js' } } })
      assert.ok(errors.some(error => error.includes(`"${hook}"`)), hook)
    }
  })

  it('requires a README, an npm lockfile and no other lockfile', () => {
    const errors = checkPlugin({ ...validPlugin(), files: new Set(['yarn.lock', 'tsup.config.ts']) })
    assert.ok(errors.some(error => error.includes('README.md')))
    assert.ok(errors.some(error => error.includes('package-lock.json')))
    assert.ok(errors.some(error => error.includes('yarn.lock')))
  })

  it('requires the plugin-kit preset', () => {
    assert.ok(checkPlugin({ ...validPlugin(), tsupConfig: 'export default {}' }).some(error => error.includes('pluginPreset')))
    assert.ok(checkPlugin({ ...validPlugin(), tsupConfig: null }).some(error => error.includes('tsup.config.ts')))
  })

  it('names each source file without an SPDX header', () => {
    const errors = checkPlugin({ ...validPlugin(), sourcesWithoutSpdx: ['src/index.ts'] })
    assert.ok(errors.some(error => error.includes('src/index.ts')))
  })
})

describe('compareVersions', () => {
  it('orders versions the way the registry does', () => {
    assert.ok(compareVersions('1.2.1', '1.2.0') > 0)
    assert.ok(compareVersions('1.10.0', '1.9.0') > 0)
    assert.ok(compareVersions('1.0.0', '1.0.0-beta.1') > 0)
    assert.ok(compareVersions('1.0.0-beta.2', '1.0.0-beta.10') < 0)
    assert.equal(compareVersions('1.0.0', '1.0.0'), 0)
  })
})

describe('checkVersionBump', () => {
  const previous = { slug: 'example', version: '1.2.0' }

  it('requires a higher version when code changed', () => {
    const errors = checkVersionBump(PATH, { slug: 'example', version: '1.2.0' }, previous, [`${PATH}/src/index.ts`])
    assert.ok(errors.some(error => error.includes('1.2.0')))
    assert.deepEqual(checkVersionBump(PATH, { slug: 'example', version: '1.2.1' }, previous, [`${PATH}/src/index.ts`]), [])
  })

  it('lets a documentation-only change keep its version', () => {
    assert.deepEqual(checkVersionBump(PATH, { slug: 'example', version: '1.2.0' }, previous, [`${PATH}/README.md`]), [])
  })

  it('needs nothing for a new plugin', () => {
    assert.deepEqual(checkVersionBump(PATH, { slug: 'example', version: '0.1.0' }, undefined, [`${PATH}/src/index.ts`]), [])
  })

  it('refuses a slug change', () => {
    const errors = checkVersionBump(PATH, { slug: 'renamed', version: '1.3.0' }, previous, [`${PATH}/manifest.json`])
    assert.ok(errors.some(error => error.includes('slug')))
  })
})

describe('findDuplicateSlugs', () => {
  it('names every folder sharing a slug', () => {
    const errors = findDuplicateSlugs([
      { path: 'plugins/a/one', manifest: { slug: 'same' } },
      { path: 'plugins/b/two', manifest: { slug: 'same' } },
      { path: 'plugins/c/three', manifest: { slug: 'other' } },
    ])
    assert.equal(errors.length, 1)
    assert.ok(errors[0].includes('plugins/a/one') && errors[0].includes('plugins/b/two'))
  })
})

describe('findForbiddenTrackedFiles', () => {
  it('flags build output, dependencies and env files, but not an example env', () => {
    const errors = findForbiddenTrackedFiles([
      'plugins/a/x/dist/index.js',
      'plugins/a/x/node_modules/react/index.js',
      'plugins/a/x/.env',
      'plugins/a/x/.env.local',
      'plugins/a/x/.env.example',
      'plugins/a/x/src/index.ts',
    ])
    assert.equal(errors.length, 4)
    assert.ok(!errors.some(error => error.includes('.env.example')))
  })
})

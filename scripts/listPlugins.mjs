// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { changedFilesSince, filesUnder, findPlugins, readFlag, repoPath } from './pluginFiles.mjs'

const since = readFlag('--changed-since')
const plugins = findPlugins().map(repoPath)
const changed = since ? changedFilesSince(since) : null
const selected = changed ? plugins.filter((plugin) => filesUnder(plugin, changed).length > 0) : plugins

console.log(JSON.stringify(selected))

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { pluginPreset } from '@collabdt/plugin-kit'

// The preset builds the single ESM file the platform serves and fails on any import it has no shim for.
export default pluginPreset()

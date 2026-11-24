// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { ActiveFiresLayer } from './components/ActiveFiresLayer'
import { ACTIVE_FIRES } from './fires'
import { useActiveFiresLegend } from './useActiveFiresLegend'

import type { LegendRegistration } from '@collabdt/plugin-kit/types/legend'
import type { MapToolProps } from '@collabdt/plugin-kit/types/map'
import type { PluginContext } from '@collabdt/plugin-kit/types/ui'

type Ctx = PluginContext<MapToolProps, unknown, LegendRegistration>

// The dataset is what a user applies; the layer and its nested legend both wait for it through `usePluginDataset`.
export function activate(ctx: Ctx): void {
  ctx.register('map.datasets', {
    id: ACTIVE_FIRES,
    name: 'Current Active Fires by Size',
    publisher: 'Canadian Interagency Forest Fire Centre (CIFFC), ECCC FireWork, NRCan CWFIS',
    description: 'Wildfires across Canada by the month of their situation report, coloured and sized by area burned, refreshed every 15 minutes. The legend adds live wildfire smoke (ECCC FireWork), fire perimeter estimates and the Fire Weather Index (NRCan CWFIS).',
    information: 'https://ciffc.net/',
    live: true,
  })

  ctx.register('map.layers', {
    id: ACTIVE_FIRES,
    component: ActiveFiresLayer,
  })

  ctx.register('viewer.legends', {
    id: ACTIVE_FIRES,
    title: 'Fires by size',
    viewers: ['map'],
    dataset: ACTIVE_FIRES,
    useLegend: useActiveFiresLegend,
  })
}

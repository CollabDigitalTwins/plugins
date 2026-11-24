// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import { usePluginDataset } from '@collabdt/core/plugins-sdk/data'
import { usePluginTranslations } from '@collabdt/core/plugins-sdk/messages'

import { MonthSlider } from './components/MonthSlider'
import { OverlayLegends } from './components/OverlayLegends'
import { ACTIVE_FIRES, countByBand, SIZE_BANDS } from './fires'
import { useFeed, useHiddenBands, useMonth, useShownOverlays } from './firesState'
import { OVERLAYS } from './overlays'

import type { LegendRow } from '@collabdt/plugin-kit/types/legend'

/** Nested under the applied dataset: a switch per size band and per overlay, live counts, the month slider and overlay ramps. */
export function useActiveFiresLegend(): {
  active: boolean
  title: string
  unavailable: boolean
  rows: LegendRow[]
  controls: React.ReactNode
} {
  const t = usePluginTranslations()
  const { applied } = usePluginDataset(ACTIVE_FIRES)
  const { fires, unavailable } = useFeed()
  const [month] = useMonth()
  const [hiddenBands, setHiddenBands] = useHiddenBands()
  const [shownOverlays, setShownOverlays] = useShownOverlays()

  const counts = React.useMemo(() => (fires ? countByBand(fires.features, month) : []), [fires, month])

  const rows = SIZE_BANDS.map((band, index) => ({
    label: t(`bands.${band.key}`, band.label),
    color: band.color,
    count: counts[index],
    visible: !hiddenBands.includes(index),
    onVisibleChange: (visible: boolean) => setHiddenBands(previous =>
      visible ? previous.filter(hidden => hidden !== index) : [...previous, index]),
  }))

  const overlayRows = [...OVERLAYS].reverse().map(overlay => ({
    label: t(`overlays.${overlay.key}`, overlay.label),
    color: overlay.color,
    visible: shownOverlays.includes(overlay.key),
    onVisibleChange: (visible: boolean) => setShownOverlays(previous =>
      visible ? [...previous, overlay.key] : previous.filter(shown => shown !== overlay.key)),
  }))

  return {
    active: applied,
    title: t('legendTitle', 'Fires by size'),
    unavailable,
    rows: [...rows, ...overlayRows],
    controls: (
      <>
        <MonthSlider />
        <OverlayLegends />
      </>
    ),
  }
}

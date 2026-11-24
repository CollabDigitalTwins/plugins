'use client'

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { useCurrentHour, useShownOverlays } from '../firesState'
import { OVERLAYS, overlayTileUrl } from '../overlays'
import { FIRE_LAYER } from '../useFireLayer'
import { overlayLayerId, useOverlayLayer } from '../useOverlayLayer'

import type { Overlay } from '../overlays'
import type { Map as MapLibreMap } from 'maplibre-gl'

const LAYERS_ABOVE = OVERLAYS.map((_, index) => [...OVERLAYS.slice(index + 1).map(overlay => overlayLayerId(overlay.key)), FIRE_LAYER])

function OverlayLayer({ map, overlay, above, shown, now }: {
  map: MapLibreMap | null
  overlay: Overlay
  above: readonly string[]
  shown: boolean
  now: Date
}) {
  useOverlayLayer(map, overlayLayerId(overlay.key), shown ? overlayTileUrl(overlay, now) : null, overlay.opacity, above)
  return null
}

/** The raster overlays switched on in the legend, stacked in `OVERLAYS` order beneath the fires. */
export function OverlayLayers({ map, visible }: { map: MapLibreMap | null, visible: boolean }) {
  const [shownOverlays] = useShownOverlays()
  const now = useCurrentHour()

  return OVERLAYS.map((overlay, index) => (
    <OverlayLayer
      key={overlay.key}
      map={map}
      overlay={overlay}
      above={LAYERS_ABOVE[index]}
      shown={visible && shownOverlays.includes(overlay.key)}
      now={now}
    />
  ))
}

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import { usePluginTranslations } from '@collabdt/core/plugins-sdk/messages'

import { useShownOverlays } from '../firesState'
import { OVERLAYS, overlayLegendUrl } from '../overlays'

import type { Overlay } from '../overlays'

function OverlayLegend({ overlay }: { overlay: Overlay }) {
  const t = usePluginTranslations()
  const [loaded, setLoaded] = React.useState(true)

  if (!loaded) return null

  const title = t(`overlays.${overlay.key}`, overlay.label)

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-muted-foreground">{title}</figcaption>
      <img
        src={overlayLegendUrl(overlay)}
        alt={title}
        onError={() => setLoaded(false)}
        className="block max-h-56 max-w-full object-contain"
      />
    </figure>
  )
}

/** Each switched-on overlay's colour ramp, as its own server draws it. */
export function OverlayLegends() {
  const [shownOverlays] = useShownOverlays()
  const ramps = OVERLAYS.filter(overlay => overlay.hasLegendImage && shownOverlays.includes(overlay.key))

  if (ramps.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-2 text-xs">
      {ramps.map(overlay => <OverlayLegend key={overlay.key} overlay={overlay} />)}
    </div>
  )
}

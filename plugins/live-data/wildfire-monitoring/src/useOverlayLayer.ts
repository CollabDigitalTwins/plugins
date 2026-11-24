// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import type { Map as MapLibreMap, RasterTileSource } from 'maplibre-gl'

export const overlayLayerId = (key: string) => `wildfire-monitoring-overlay-${key}`

/** Draws raster tiles at `tileUrl` while it is non-null, beneath the first of `above` already on the map. */
export function useOverlayLayer(
  map: MapLibreMap | null,
  id: string,
  tileUrl: string | null,
  opacity: number,
  above: readonly string[],
): void {
  const tileUrlRef = React.useRef(tileUrl)
  tileUrlRef.current = tileUrl
  const aboveRef = React.useRef(above)
  aboveRef.current = above

  const shown = tileUrl !== null

  React.useEffect(() => {
    if (!map || !shown) return

    // Re-run on every style change: the basemap switcher drops every source and layer.
    const ensureLayer = () => {
      if (!map.getStyle() || map.getSource(id) || !tileUrlRef.current) return

      const beforeId = aboveRef.current.find(layer => map.getLayer(layer))
      map.addSource(id, { type: 'raster', tiles: [tileUrlRef.current], tileSize: 256 })
      map.addLayer({ id, type: 'raster', source: id, paint: { 'raster-opacity': opacity } }, beforeId)
    }

    if (map.isStyleLoaded()) ensureLayer()
    map.on('styledata', ensureLayer)

    return () => {
      map.off('styledata', ensureLayer)
      if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(id)) map.removeSource(id)
    }
  }, [map, shown, id, opacity])

  // setTiles, not a teardown: re-adding the layer on the hour would make it flicker.
  React.useEffect(() => {
    if (!map || !tileUrl) return
    (map.getSource(id) as RasterTileSource | undefined)?.setTiles([tileUrl])
  }, [map, id, tileUrl])
}

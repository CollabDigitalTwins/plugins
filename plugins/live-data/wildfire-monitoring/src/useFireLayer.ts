// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import { sizeColorExpression } from './fires'

import type { FireCollection, FireFeature } from './fires'
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl'

const SOURCE = 'wildfire-monitoring-active-fires'
export const FIRE_LAYER = 'wildfire-monitoring-active-fires'

const PAINT = {
  'circle-color': sizeColorExpression(),
  'circle-radius': ['interpolate', ['linear'], ['get', 'field_fire_size'], 0, 4, 50, 8, 500, 12, 1000, 16, 10000, 22, 100000, 28],
  'circle-opacity': 0.75,
  'circle-stroke-color': '#000000',
  'circle-stroke-width': 0.7,
}

/** Draws `fires` through `filter` while it is non-null, and reports the fire a user clicks. */
export function useFireLayer(
  map: MapLibreMap | null,
  fires: FireCollection | null,
  filter: unknown[],
  onSelect: (fire: FireFeature) => void,
): void {
  const firesRef = React.useRef(fires)
  firesRef.current = fires
  const filterRef = React.useRef(filter)
  filterRef.current = filter
  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect

  const shown = fires !== null

  React.useEffect(() => {
    if (!map || !shown) return

    // Re-run on every style change: the basemap switcher drops every source and layer.
    const ensureLayer = () => {
      if (!map.getStyle() || map.getSource(SOURCE) || !firesRef.current) return

      map.addSource(SOURCE, { type: 'geojson', data: firesRef.current })
      map.addLayer({ id: FIRE_LAYER, type: 'circle', source: SOURCE, paint: PAINT as never, filter: filterRef.current as never })
    }

    const select = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.field_system_fire_id
      const fire = firesRef.current?.features.find(candidate => candidate.properties.field_system_fire_id === id)
      if (fire) onSelectRef.current(fire)
    }

    const pointer = () => { map.getCanvas().style.cursor = 'pointer' }
    const clearPointer = () => { map.getCanvas().style.cursor = '' }

    if (map.isStyleLoaded()) ensureLayer()
    map.on('styledata', ensureLayer)
    map.on('click', FIRE_LAYER, select)
    map.on('mouseenter', FIRE_LAYER, pointer)
    map.on('mouseleave', FIRE_LAYER, clearPointer)

    return () => {
      map.off('styledata', ensureLayer)
      map.off('click', FIRE_LAYER, select)
      map.off('mouseenter', FIRE_LAYER, pointer)
      map.off('mouseleave', FIRE_LAYER, clearPointer)

      // Guarded: the style may be gone, and removing what is already gone throws.
      if (map.getLayer(FIRE_LAYER)) map.removeLayer(FIRE_LAYER)
      if (map.getSource(SOURCE)) map.removeSource(SOURCE)
      clearPointer()
    }
  }, [map, shown])

  React.useEffect(() => {
    if (map?.getLayer(FIRE_LAYER)) map.setFilter(FIRE_LAYER, filter as never)
  }, [map, filter])

  // setData, not a teardown: re-adding the layer on each refresh would make the fires flicker.
  React.useEffect(() => {
    if (!map || !fires) return
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(fires)
  }, [map, fires])
}

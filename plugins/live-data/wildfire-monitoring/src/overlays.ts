// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

export type OverlayKey = 'smoke' | 'perimeters' | 'fwi'

export interface Overlay {
  key: OverlayKey
  label: string
  color: string
  wmsUrl: string
  layer: string
  style: string
  opacity: number
  hasLegendImage: boolean
  time: (now: Date) => string | null
}

const GEOMET_WMS_URL = 'https://geo.weather.gc.ca/geomet'
const CWFIS_WMS_URL = 'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wms'

const utcHour = (now: Date) => `${now.toISOString().slice(0, 13)}:00:00Z`
const utcDay = (now: Date) => now.toISOString().slice(0, 10)

/** Raster overlays drawn beneath the fires, bottom to top. */
export const OVERLAYS: readonly Overlay[] = [
  {
    key: 'fwi',
    label: 'Fire Weather Index',
    color: '#f97316',
    wmsUrl: CWFIS_WMS_URL,
    layer: 'fwi',
    style: '',
    opacity: 0.6,
    hasLegendImage: true,
    time: utcDay,
  },
  {
    key: 'smoke',
    label: 'Wildfire smoke (PM2.5)',
    color: '#6b7280',
    wmsUrl: GEOMET_WMS_URL,
    layer: 'RAQDPS.Sfc_PM2.5-WildfireSmokePlume',
    style: 'PM2.5_0to100ugm3_Dis',
    opacity: 0.7,
    hasLegendImage: true,
    time: utcHour,
  },
  {
    key: 'perimeters',
    label: 'Fire perimeter estimates',
    color: '#dc2626',
    wmsUrl: CWFIS_WMS_URL,
    layer: 'm3_polygons_current',
    style: '',
    opacity: 0.85,
    hasLegendImage: false,
    time: () => null,
  },
]

/** A MapLibre raster tile template; `{bbox-epsg-3857}` stays literal for MapLibre to fill per tile. */
export function overlayTileUrl(overlay: Overlay, now: Date): string {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    LAYERS: overlay.layer,
    STYLES: overlay.style,
    SRS: 'EPSG:3857',
    WIDTH: '256',
    HEIGHT: '256',
  })
  const time = overlay.time(now)
  // A layer without a time dimension still gets a daily key so the browser drops yesterday's tiles.
  params.set(time === null ? 'DAY' : 'TIME', time ?? utcDay(now))
  return `${overlay.wmsUrl}?${params.toString()}&BBOX={bbox-epsg-3857}`
}

export function overlayLegendUrl(overlay: Overlay): string {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetLegendGraphic',
    LAYER: overlay.layer,
    FORMAT: 'image/png',
    SLD_VERSION: '1.1.0',
  })
  if (overlay.style) params.set('STYLE', overlay.style)
  return `${overlay.wmsUrl}?${params.toString()}`
}

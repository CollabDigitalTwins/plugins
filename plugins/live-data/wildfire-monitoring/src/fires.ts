// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

export const ACTIVE_FIRES = 'active-fires'

export const CIFFC_FIRES_URL = 'https://api.ciffc.net/v1/dashboard/fires'

const FETCH_TIMEOUT_MS = 30_000

export type FireProperties = {
  /** Index into `SIZE_BANDS`, so the map filters a band without recomputing it. */
  band: number
  /** 0–11, the month of the situation report, which is what the month slider filters on. */
  month: number
  field_system_fire_id: string
  field_fire_size: number
  field_stage_of_control_status: string
  field_response_type: string
  field_situation_report_date: string
  field_status_date: string
}

export type FireFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: FireProperties
}

export type FireCollection = { type: 'FeatureCollection'; features: FireFeature[] }

export interface SizeBand {
  key: string
  label: string
  /** Hectares, inclusive. A band runs up to the next band's `min`. */
  min: number
  color: string
}

export const SIZE_BANDS: readonly SizeBand[] = [
  { key: 'under50', label: 'Under 50 ha', min: 0, color: '#9acd32' },
  { key: 'from50', label: '50–500 ha', min: 50, color: '#ffff00' },
  { key: 'from500', label: '500–1,000 ha', min: 500, color: '#ffa500' },
  { key: 'from1000', label: '1,000–10,000 ha', min: 1000, color: '#ff0000' },
  { key: 'from10000', label: '10,000 ha and over', min: 10000, color: '#800080' },
]

export function bandIndex(hectares: number): number {
  return SIZE_BANDS.findLastIndex(band => hectares >= band.min)
}

export function countByBand(fires: FireFeature[], month: number): number[] {
  const counts = SIZE_BANDS.map(() => 0)
  for (const fire of fires) if (fire.properties.month === month) counts[fire.properties.band]++
  return counts
}

/** Fires reported in `month`, minus the size bands switched off in the legend. */
export function fireFilter(month: number, hiddenBands: number[]): unknown[] {
  return ['all', ['==', ['get', 'month'], month], ['!', ['in', ['get', 'band'], ['literal', hiddenBands]]]]
}

/** A MapLibre `step` over the same thresholds as `SIZE_BANDS`, so the map and legend agree. */
export function sizeColorExpression(): unknown[] {
  const [first, ...rest] = SIZE_BANDS
  return ['step', ['get', 'field_fire_size'], first.color, ...rest.flatMap(band => [band.min, band.color])]
}

type RawFire = { properties?: Record<string, unknown> }

// The feed's own geometry is unreliable (it has sent [lat, lat]), so the point is rebuilt from the properties.
function toFire(raw: RawFire): FireFeature | null {
  const properties = raw.properties ?? {}
  const longitude = Number.parseFloat(String(properties.field_longitude))
  const latitude = Number.parseFloat(String(properties.field_latitude))
  const hectares = Number.parseFloat(String(properties.field_fire_size))
  const reported = String(properties.field_situation_report_date ?? '')
  const month = new Date(reported).getMonth()
  if ([longitude, latitude, month].some(Number.isNaN)) return null

  const size = Number.isNaN(hectares) ? 0 : hectares

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      band: bandIndex(size),
      month,
      field_system_fire_id: String(properties.field_system_fire_id ?? ''),
      field_fire_size: size,
      field_stage_of_control_status: String(properties.field_stage_of_control_status ?? ''),
      field_response_type: String(properties.field_response_type ?? ''),
      field_situation_report_date: reported,
      field_status_date: String(properties.field_status_date ?? ''),
    },
  }
}

/** The season's fires, out ones included: the month slider decides which are drawn. */
export function toFires(feed: { features?: RawFire[] }): FireCollection {
  const features = (feed.features ?? []).map(toFire).filter((fire): fire is FireFeature => fire !== null)
  return { type: 'FeatureCollection', features }
}

export async function fetchFires(signal: AbortSignal): Promise<FireCollection> {
  const response = await fetch(CIFFC_FIRES_URL, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]),
  })
  if (!response.ok) throw new Error(`CIFFC returned HTTP ${response.status}`)
  return toFires(await response.json() as { features?: RawFire[] })
}

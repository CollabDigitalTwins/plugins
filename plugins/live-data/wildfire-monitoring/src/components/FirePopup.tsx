'use client'

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'
import { createPortal } from 'react-dom'

import { usePluginTranslations } from '@collabdt/core/plugins-sdk/messages'

import type { FireFeature } from '../fires'
import type { Map as MapLibreMap } from 'maplibre-gl'

interface Props {
  map: MapLibreMap
  fire: FireFeature
  onClose: () => void
}

const STAGE_FALLBACKS: Record<string, string> = {
  OC: 'Out of control',
  BH: 'Being held',
  UC: 'Under control',
  OUT: 'Out',
}

const RESPONSE_FALLBACKS: Record<string, string> = {
  FUL: 'Full response',
  MOD: 'Modified response',
  MON: 'Monitored response',
}

function formatDate(value: string, locale: string | undefined): string {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

/** Portalled into the map's container and positioned with `map.project`, so it follows every move. */
export function FirePopup({ map, fire, onClose }: Props) {
  const t = usePluginTranslations()
  const [, reposition] = React.useReducer((tick: number) => tick + 1, 0)

  React.useEffect(() => {
    map.on('move', reposition)
    return () => {
      map.off('move', reposition)
    }
  }, [map])

  const {
    field_system_fire_id: id,
    field_fire_size: hectares,
    field_stage_of_control_status: stage,
    field_response_type: response,
    field_situation_report_date: reported,
    field_status_date: updated,
  } = fire.properties
  const locale = typeof navigator === 'undefined' ? undefined : navigator.language
  const { x, y } = map.project(fire.geometry.coordinates)

  const rows: Array<[string, string]> = [
    [t('popup.reported', 'Report date'), formatDate(reported, locale)],
    [t('popup.response', 'Response'), t(`response.${response}`, RESPONSE_FALLBACKS[response] ?? response)],
    [t('popup.stage', 'Stage of control'), t(`stage.${stage}`, STAGE_FALLBACKS[stage] ?? stage)],
    [t('popup.size', 'Size'), `${hectares.toLocaleString(locale)} ha`],
    [t('popup.updated', 'Latest update'), formatDate(updated, locale)],
  ]

  return createPortal(
    <div className="absolute z-10 -translate-x-1/2 -translate-y-full pb-3" style={{ left: x, top: y }}>
      <div className="min-w-56 rounded-md border bg-background p-3 shadow-lg">
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{id}</p>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('close', 'Close')}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {rows.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </div>,
    map.getContainer(),
  )
}

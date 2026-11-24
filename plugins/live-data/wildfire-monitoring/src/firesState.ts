// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import { usePluginState } from '@collabdt/core/plugins-sdk/state'

import { fetchFires } from './fires'

import type { FireCollection } from './fires'
import type { OverlayKey } from './overlays'

const REFRESH_MS = 15 * 60_000
const HOUR_MS = 60 * 60_000
const CLOCK_CHECK_MS = 60_000

interface Feed {
  fires: FireCollection | null
  unavailable: boolean
}

const INITIAL_FEED: Feed = { fires: null, unavailable: false }
const NO_HIDDEN_BANDS: number[] = []
const NO_SHOWN_OVERLAYS: OverlayKey[] = []

/** The feed as the layer and the legend share it. */
export function useFeed(): Feed {
  return usePluginState<Feed>('feed', INITIAL_FEED)[0]
}

/** Which month's reports are drawn; the current month until the slider moves. */
export function useMonth(): [number, (month: number) => void] {
  return usePluginState<number>('month', new Date().getMonth())
}

/** Size bands switched off in the legend, as indexes into `SIZE_BANDS`. */
export function useHiddenBands(): [number[], (next: number[] | ((previous: number[]) => number[])) => void] {
  return usePluginState<number[]>('hidden-bands', NO_HIDDEN_BANDS)
}

/** Raster overlays switched on in the legend; all off until a user picks one. */
export function useShownOverlays(): [OverlayKey[], (next: OverlayKey[] | ((previous: OverlayKey[]) => OverlayKey[])) => void] {
  return usePluginState<OverlayKey[]>('shown-overlays', NO_SHOWN_OVERLAYS)
}

/** The start of the current hour, advancing on the hour so time-keyed tiles follow the clock. */
export function useCurrentHour(): Date {
  const [hour, setHour] = React.useState(() => Math.floor(Date.now() / HOUR_MS))

  React.useEffect(() => {
    const timer = window.setInterval(() => setHour(Math.floor(Date.now() / HOUR_MS)), CLOCK_CHECK_MS)
    return () => window.clearInterval(timer)
  }, [])

  return React.useMemo(() => new Date(hour * HOUR_MS), [hour])
}

/** Fetches CIFFC's season while `enabled` and refreshes it every 15 minutes, for every surface to read. */
export function useFeedLoader(enabled: boolean): void {
  const [, setFeed] = usePluginState<Feed>('feed', INITIAL_FEED)

  React.useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()

    const load = async () => {
      try {
        setFeed({ fires: await fetchFires(controller.signal), unavailable: false })
      } catch {
        // Keeps the last good fires on the map, flagged stale in the legend.
        if (!controller.signal.aborted) setFeed(previous => ({ ...previous, unavailable: true }))
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [enabled, setFeed])
}

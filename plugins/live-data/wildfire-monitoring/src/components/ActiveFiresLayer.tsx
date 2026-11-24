'use client'

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import * as React from 'react'

import { usePluginDataset } from '@collabdt/core/plugins-sdk/data'

import { ACTIVE_FIRES, fireFilter } from '../fires'
import { useFeed, useFeedLoader, useHiddenBands, useMonth } from '../firesState'
import { useFireLayer } from '../useFireLayer'

import { FirePopup } from './FirePopup'
import { OverlayLayers } from './OverlayLayers'

import type { FireFeature } from '../fires'
import type { MapToolProps } from '@collabdt/plugin-kit/types/map'

/** Fetches once the dataset is applied; draws only while its switch in the applied-layers card is on. */
export function ActiveFiresLayer({ map }: MapToolProps) {
  const { applied, visible } = usePluginDataset(ACTIVE_FIRES)
  useFeedLoader(applied)

  const { fires } = useFeed()
  const [month] = useMonth()
  const [hiddenBands] = useHiddenBands()
  const filter = React.useMemo(() => fireFilter(month, hiddenBands), [month, hiddenBands])
  const [selected, setSelected] = React.useState<FireFeature | null>(null)

  useFireLayer(map, visible ? fires : null, filter, setSelected)

  const selectedShown = selected !== null
    && selected.properties.month === month
    && !hiddenBands.includes(selected.properties.band)

  React.useEffect(() => {
    if (!visible || !selectedShown) setSelected(null)
  }, [visible, selectedShown])

  return (
    <>
      <OverlayLayers map={map} visible={visible} />
      {map && selected && selectedShown && <FirePopup map={map} fire={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025 Collab Digital Twins

import { usePluginTranslations } from '@collabdt/core/plugins-sdk/messages'

import { useMonth } from '../firesState'

function monthName(month: number): string {
  const locale = typeof navigator === 'undefined' ? undefined : navigator.language
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, month, 1))
}

/** Picks which month's situation reports the map and the counts show. */
export function MonthSlider() {
  const t = usePluginTranslations()
  const [month, setMonth] = useMonth()

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex justify-between">
        <span className="text-muted-foreground">{t('reportedIn', 'Fires reported in')}</span>
        <span className="font-medium">{monthName(month)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={11}
        step={1}
        value={month}
        onChange={event => setMonth(Number(event.target.value))}
        aria-label={t('reportedIn', 'Fires reported in')}
        className="w-full accent-current"
      />
    </label>
  )
}

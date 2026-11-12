import { useMemo, useState } from 'react'

import { PageHeader } from '../../../../shared/components/antd'
import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { busyScheduleApi } from '../../../busy-schedule/api/busyScheduleApi'
import {
  addDays,
  indexBusyItems,
  mondayOf,
  todayIso,
  weekDays,
} from '../../../busy-schedule/lib/busySessions'
import { AvailabilityBanner } from './components/AvailabilityBanner'
import { BusyScheduleGrid } from './components/BusyScheduleGrid'
import { WeekNav } from './components/WeekNav'
import { useToggleBusy } from './hooks/useToggleBusy'
import { availabilityPageMessages } from './AvailabilityPage.messages'

export function AvailabilityPage() {
  const { t } = useI18n(availabilityPageMessages)
  const [anchor, setAnchor] = useState(() => todayIso())
  const monday = mondayOf(anchor)
  const query = useApiQuery(
    (signal) => busyScheduleApi.getMyWeek(monday, signal),
    [monday],
  )
  const week = query.data?.weekStart === monday ? query.data : undefined
  const busyByCell = useMemo(
    () => indexBusyItems(week?.items ?? []),
    [week],
  )
  const toggle = useToggleBusy(busyByCell, query.reload)

  if (!week && query.error) {
    return (
      <EmptyState
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => query.reload()}
          >
            {t.retry}
          </button>
        }
      />
    )
  }
  if (!week) return <LoadingState />

  const full = week.remainingSessions <= 0
  return (
    <div className="odm-opr-page">
      <PageHeader title={t.pageTitle} description={t.pageSubtitle} />
      <WeekNav
        weekStart={week.weekStart}
        weekEnd={week.weekEnd}
        onShift={(weeks) => setAnchor(addDays(monday, weeks * 7))}
        onToday={() => setAnchor(todayIso())}
      />
      {toggle.error ? (
        <AvailabilityBanner tone="red">{toggle.error}</AvailabilityBanner>
      ) : week.items.length === 0 ? (
        <AvailabilityBanner tone="yellow">{t.emptyWeekBanner}</AvailabilityBanner>
      ) : null}
      <div style={{ fontSize: 12.5, color: 'var(--tx3)' }}>
        {t.quota(week.usedSessions, week.maxSessionsPerWeek)}
        {full ? ` · ${t.quotaFull}` : ''}
      </div>
      <BusyScheduleGrid
        days={weekDays(monday)}
        busyByCell={busyByCell}
        pendingKeys={toggle.pendingKeys}
        canAddMore={!full}
        now={Date.now()}
        onToggle={toggle.toggle}
      />
      <p style={{ fontSize: 12, color: 'var(--tx3)', margin: 0 }}>{t.hint}</p>
    </div>
  )
}

import { useMemo, useState } from 'react'

import { CardComponent, PageHeader } from '../../../../shared/components/antd'
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
  isSessionPast,
  mondayOf,
  todayIso,
  weekDays,
} from '../../../busy-schedule/lib/busySessions'
import { AvailabilityBanner } from './components/AvailabilityBanner'
import { AvailabilitySummary } from './components/AvailabilitySummary'
import { BusyDayList } from './components/BusyDayList'
import { BusyScheduleGrid } from './components/BusyScheduleGrid'
import type { CellContext } from './components/SessionCell'
import { WeekNav } from './components/WeekNav'
import { useIsNarrow } from './hooks/useIsNarrow'
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
  const narrow = useIsNarrow()

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
  const now = Date.now()
  const days = weekDays(monday)
  const today = todayIso(now)
  const ctx: CellContext = {
    busyByCell,
    pendingKeys: toggle.pendingKeys,
    canAddMore: !full,
    isPast: (date, session) => isSessionPast(date, session, now),
    onToggle: toggle.toggle,
  }
  const View = narrow ? BusyDayList : BusyScheduleGrid
  return (
    <div className="odm-opr-page">
      <PageHeader
        title={t.pageTitle}
        description={t.pageSubtitle}
        actions={
          <div className="odm-avail-actions">
            <span
              className={`odm-avail-chip${full ? ' is-full' : ''}`}
              aria-label={t.quota(week.usedSessions, week.maxSessionsPerWeek)}
            >
              {t.quotaChip(week.usedSessions, week.maxSessionsPerWeek)}
            </span>
            <WeekNav
              weekStart={week.weekStart}
              weekEnd={week.weekEnd}
              onShift={(weeks) => setAnchor(addDays(monday, weeks * 7))}
              onToday={() => setAnchor(todayIso())}
            />
          </div>
        }
      />
      {toggle.error ? (
        <AvailabilityBanner tone="red">{toggle.error}</AvailabilityBanner>
      ) : null}
      <div className="odm-avail-layout">
        <CardComponent className="odm-avail-grid-card">
          <View days={days} today={today} ctx={ctx} label={t.gridLabel} />
        </CardComponent>
        <AvailabilitySummary
          week={week}
          pendingKeys={toggle.pendingKeys}
          now={now}
          onCancel={toggle.toggle}
        />
      </div>
    </div>
  )
}

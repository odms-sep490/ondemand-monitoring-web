import { useMemo } from 'react'
import type { EventContentArg, EventInput } from '@fullcalendar/core'

import {
  CalendarComponent,
  type CalendarView,
} from '../../../../../shared/components/antd'
import { toStatusTagTone } from '../../../components/common/StatusTag'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import {
  DEFAULT_MISSION_MINUTES,
  SLOT_MAX_TIME,
  SLOT_MIN_TIME,
} from '../scheduleHelpers'

// ── ScheduleCalendar ───────────────────────────────────────────────────────

export type ScheduleCalendarProps = {
  missions: MissionCalendarItem[]
  date: Date
  view: 'week' | 'day'
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  t: PageMessages
  lang: string
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

const VIEW: Record<'week' | 'day', CalendarView> = {
  week: 'timeGridWeek',
  day: 'timeGridDay',
}

/** Maps schedule items to FullCalendar events; colour comes from the status tone. */
export function ScheduleCalendar({
  missions,
  date,
  view,
  selectedId,
  onSelect,
  t,
  lang,
  getMissionStatusLabel,
}: ScheduleCalendarProps) {
  const events = useMemo<EventInput[]>(
    () =>
      missions
        .filter((m) => m.scheduledStartAt)
        .map((m) => {
          const tone = toStatusTagTone(missionStatusTone[m.status] ?? 'gray')
          const start = m.scheduledStartAt!
          const end =
            m.scheduledEndAt ??
            new Date(
              new Date(start).getTime() + DEFAULT_MISSION_MINUTES * 60_000,
            ).toISOString()
          return {
            id: m.id,
            title: m.missionCode,
            start,
            end,
            classNames: [
              `cal-tone-${tone}`,
              ...(selectedId === m.id ? ['is-selected'] : []),
            ],
            extendedProps: { mission: m },
          }
        }),
    [missions, selectedId],
  )

  const renderEvent = (info: EventContentArg) => {
    const m = info.event.extendedProps.mission as MissionCalendarItem
    return (
      <div
        className="cal-ev"
        role="button"
        tabIndex={0}
        aria-pressed={selectedId === m.id}
        aria-label={`${m.missionCode} ${getMissionStatusLabel(m.status)}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(m)
          }
        }}
      >
        <span className="cal-ev-code">{m.missionCode.slice(-6)}</span>
        {m.droneCode && (
          <span className="cal-ev-meta">
            {m.droneCode}
            {m.operatorName ? ` · ${m.operatorName.split(' ').at(-1)}` : ''}
          </span>
        )}
      </div>
    )
  }

  return (
    <CalendarComponent
      ariaLabel={t.weekGridAriaLabel}
      view={VIEW[view]}
      date={date}
      headerToolbar={false}
      events={events}
      height={720}
      slotMinTime={SLOT_MIN_TIME}
      slotMaxTime={SLOT_MAX_TIME}
      slotDuration="01:00:00"
      locale={lang === 'en' ? 'en' : 'vi'}
      eventContentRenderer={renderEvent}
      eventClick={(arg) =>
        onSelect(arg.event.extendedProps.mission as MissionCalendarItem)
      }
    />
  )
}

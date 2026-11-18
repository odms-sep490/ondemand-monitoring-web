import { useMemo } from 'react'
import type { EventContentArg, EventInput } from '@fullcalendar/core'

import {
  CalendarComponent,
  type CalendarView,
} from '../../../../../shared/components/antd'
import type { MissionCalendarItem } from '../../../types/missions'
import { MissionEventBlock } from './MissionEventBlock'
import type { PageMessages } from '../scheduleTypes'
import {
  DEFAULT_MISSION_MINUTES,
  getMissionStatusGroup,
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
          const group = getMissionStatusGroup(m.status)
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
              `cal-st-${group}`,
              ...(selectedId === m.id ? ['is-selected'] : []),
            ],
            extendedProps: { mission: m },
          }
        }),
    [missions, selectedId],
  )

  const isTouch = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none)').matches

  const renderEvent = (info: EventContentArg) => {
    const m = info.event.extendedProps.mission as MissionCalendarItem
    return (
      <MissionEventBlock
        mission={m}
        start={info.event.start}
        end={info.event.end}
        selected={selectedId === m.id}
        statusLabel={getMissionStatusLabel(m.status)}
        touch={isTouch()}
        lang={lang}
        t={t}
        onSelect={onSelect}
      />
    )
  }

  return (
    <CalendarComponent
      ariaLabel={t.weekGridAriaLabel}
      view={VIEW[view]}
      date={date}
      headerToolbar={false}
      events={events}
      height="calc(100vh - 340px)"
      className={`cal-${view}`}
      slotMinTime={SLOT_MIN_TIME}
      slotMaxTime={SLOT_MAX_TIME}
      slotDuration="01:00:00"
      locale={lang === 'en' ? 'en' : 'vi'}
      eventContentRenderer={renderEvent}
      eventClick={(arg) => {
        // Touch: the tap opens the detail card; its button navigates.
        if (isTouch()) return
        onSelect(arg.event.extendedProps.mission as MissionCalendarItem)
      }}
    />
  )
}

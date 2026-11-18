import { useMemo } from 'react'
import { Tooltip } from 'antd'
import type { EventContentArg, EventInput } from '@fullcalendar/core'

import {
  CalendarComponent,
  type CalendarView,
} from '../../../../../shared/components/antd'
import type { MissionCalendarItem } from '../../../types/missions'
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

  const formatTime = (value: Date | null) =>
    value
      ? value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : ''

  const renderEvent = (info: EventContentArg) => {
    const m = info.event.extendedProps.mission as MissionCalendarItem
    const statusLabel = getMissionStatusLabel(m.status)
    const shortMs = 60 * 60_000
    const isShort =
      !!info.event.start &&
      !!info.event.end &&
      info.event.end.getTime() - info.event.start.getTime() <= shortMs
    const timeRange = `${formatTime(info.event.start)} – ${formatTime(info.event.end)}`
    const drone = m.droneCode ?? m.droneName
    const meta = [drone, m.operatorName].filter(Boolean).join(' · ')
    const tooltip = (
      <div className="cal-tip">
        <strong className="cal-tip-code">{m.missionCode}</strong>
        {m.serviceLabel ? <div>{m.serviceLabel}</div> : null}
        <div>
          {t.calendarStatus}: {statusLabel}
        </div>
        <div>
          {t.calendarTime}: {timeRange}
        </div>
        <div>
          {t.calendarDrone}: {drone ?? t.calendarNoDrone}
        </div>
        <div>
          {t.calendarPilot}: {m.operatorName ?? t.calendarNoPilot}
        </div>
      </div>
    )
    return (
      <Tooltip title={tooltip} mouseEnterDelay={0.25} placement="right">
        <div
          className={`cal-ev${isShort ? ' cal-ev--short' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={selectedId === m.id}
          aria-label={`${m.missionCode} ${statusLabel}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(m)
            }
          }}
        >
          <span className="cal-ev-code" title={m.missionCode}>
            {m.missionCode}
          </span>
          {meta ? <span className="cal-ev-meta">{meta}</span> : null}
          <span className="cal-ev-time">
            <span className="cal-ev-time-full">{timeRange}</span>
            <span className="cal-ev-time-short">
              {formatTime(info.event.start)}
            </span>
          </span>
        </div>
      </Tooltip>
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
      eventClick={(arg) =>
        onSelect(arg.event.extendedProps.mission as MissionCalendarItem)
      }
    />
  )
}

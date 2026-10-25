import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { useMemo } from 'react'
import {
  TOTAL_HOURS,
  HOUR_START,
  formatDateShort,
  PX_PER_HOUR,
  isSameDay,
} from '../scheduleHelpers'
import { MissionBlock } from './MissionBlock'

// ── WeekGrid ───────────────────────────────────────────────────────────────

export type WeekGridProps = {
  days: Date[]
  missions: MissionCalendarItem[]
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  t: PageMessages
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

export function WeekGrid({
  days,
  missions,
  selectedId,
  onSelect,
  t,
  getMissionStatusLabel,
}: WeekGridProps) {
  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i),
    [],
  )

  return (
    <div className="odm-sched-grid" aria-label={t.weekGridAriaLabel}>
      {/* Header row */}
      <div className="odm-sched-grid-head">
        {/* Time gutter label */}
        <div className="odm-sched-gutter" />
        {days.map((day, i) => (
          <div key={i} className="odm-sched-day-head">
            <span style={{ color: 'var(--tx3)', fontSize: 11 }}>
              {t.shortDays[i]}
            </span>{' '}
            <span style={{ fontWeight: 600 }}>{formatDateShort(day)}</span>
          </div>
        ))}
      </div>

      {/* Body: time labels + day columns */}
      <div
        className="odm-sched-grid-body"
        style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
      >
        {/* Time labels */}
        <div className="odm-sched-gutter">
          {hours.map((h) => (
            <div
              key={h}
              style={{
                height: PX_PER_HOUR,
                fontSize: 11,
                color: 'var(--tx3)',
                paddingTop: 2,
              }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => {
          const dayMissions = missions.filter(
            (m) =>
              m.scheduledStartAt &&
              isSameDay(new Date(m.scheduledStartAt), day),
          )
          return (
            <div key={di} className="odm-sched-day-col">
              {/* Horizontal hour lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    top: (h - HOUR_START) * PX_PER_HOUR,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: 'var(--bd)',
                  }}
                />
              ))}
              {dayMissions.map((m) => (
                <MissionBlock
                  key={m.id}
                  mission={m}
                  dayIndex={di}
                  selected={selectedId === m.id}
                  onSelect={onSelect}
                  missionStatusLabel={getMissionStatusLabel(m.status)}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

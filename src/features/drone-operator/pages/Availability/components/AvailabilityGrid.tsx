import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  rangeSelect,
  slotKey,
  slotTimes,
  type AvailabilityStatus,
} from '../../../lib/availabilitySlots'
import { availabilityGridMessages } from './AvailabilityGrid.messages'

const STATUS_STYLE: Record<AvailabilityStatus, React.CSSProperties> = {
  AVAILABLE: { background: 'var(--green-bg)' },
  BUSY: { background: 'var(--sf3)' },
  OFF: {
    background:
      'repeating-linear-gradient(45deg, var(--sf2) 0, var(--sf2) 4px, var(--bg) 4px, var(--bg) 8px)',
  },
}

export type MissionOverlay = {
  day: string
  time: string
  label: string
  tone: 'green' | 'gray'
}

export function AvailabilityGrid({
  days,
  slots,
  overlays,
  onSelectionChange,
}: {
  days: string[]
  slots: Record<string, AvailabilityStatus>
  overlays: MissionOverlay[]
  onSelectionChange: (keys: string[]) => void
}) {
  const { t } = useI18n(availabilityGridMessages)
  const WEEKDAY_SHORT = t.weekdayShort
  const times = slotTimes()
  const [anchor, setAnchor] = useState<{ day: string; time: string } | null>(
    null,
  )
  const [dragging, setDragging] = useState(false)

  const overlayByKey = new Map(overlays.map((o) => [slotKey(o.day, o.time), o]))

  function startDrag(day: string, time: string) {
    setAnchor({ day, time })
    setDragging(true)
    onSelectionChange(rangeSelect(days, times, { day, time }, { day, time }))
  }

  function moveDrag(day: string, time: string) {
    if (!dragging || !anchor) return
    onSelectionChange(rangeSelect(days, times, anchor, { day, time }))
  }

  function endDrag() {
    setDragging(false)
  }

  return (
    <div
      className="odm-card"
      style={{ overflowX: 'auto' }}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <table
        style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: 60,
                fontSize: 11,
                color: 'var(--tx3)',
                padding: 6,
              }}
            />
            {days.map((day) => {
              const d = new Date(`${day}T00:00:00+07:00`)
              return (
                <th
                  key={day}
                  style={{
                    padding: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    borderBottom: '1px solid var(--bd)',
                    textAlign: 'center',
                  }}
                >
                  {WEEKDAY_SHORT[d.getDay()]}{' '}
                  {String(d.getDate()).padStart(2, '0')}/
                  {String(d.getMonth() + 1).padStart(2, '0')}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td
                style={{
                  fontSize: 10.5,
                  color: 'var(--tx3)',
                  padding: '2px 6px',
                  textAlign: 'right',
                  verticalAlign: 'top',
                }}
              >
                {time.endsWith(':00') ? time : ''}
              </td>
              {days.map((day) => {
                const key = slotKey(day, time)
                const status = slots[key]
                const overlay = overlayByKey.get(key)
                return (
                  <td
                    key={key}
                    data-testid={`slot-${key}`}
                    onMouseDown={() => !overlay && startDrag(day, time)}
                    onMouseEnter={() => moveDrag(day, time)}
                    style={{
                      height: 18,
                      border: '1px solid var(--bd)',
                      cursor: overlay ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      ...(status ? STATUS_STYLE[status] : {}),
                    }}
                    title={overlay ? overlay.label : undefined}
                  >
                    {overlay ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 1,
                          background:
                            overlay.tone === 'green'
                              ? 'var(--green-solid)'
                              : 'var(--sf3)',
                          borderRadius: 2,
                          fontSize: 8,
                          color: '#fff',
                          overflow: 'hidden',
                          padding: '1px 2px',
                        }}
                      >
                        {overlay.label}
                      </div>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

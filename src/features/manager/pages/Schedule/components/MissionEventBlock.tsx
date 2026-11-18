import { useState } from 'react'
import { Button, Popover } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd/mgrPopupContainer'
import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { getMissionStatusGroup } from '../scheduleHelpers'

export type MissionEventBlockProps = {
  mission: MissionCalendarItem
  start: Date | null
  end: Date | null
  selected: boolean
  statusLabel: string
  /** Touch devices: a tap opens the card; the card button navigates. */
  touch: boolean
  lang: string
  t: PageMessages
  onSelect: (m: MissionCalendarItem) => void
}

const formatTime = (value: Date | null) =>
  value
    ? value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

/** Compact calendar block; hover/focus (tap on touch) pops out a detail card. */
export function MissionEventBlock({
  mission: m,
  start,
  end,
  selected,
  statusLabel,
  touch,
  lang,
  t,
  onSelect,
}: MissionEventBlockProps) {
  const [open, setOpen] = useState(false)
  const group = getMissionStatusGroup(m.status)
  const timeRange = `${formatTime(start)} – ${formatTime(end)}`
  const drone = m.droneCode ?? m.droneName
  const date = start
    ? start.toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : ''
  const card = (
    <div className={`cal-card cal-st-${group}`}>
      <div className="cal-card-status">
        <i className="cal-card-dot" />
        {statusLabel}
      </div>
      <strong className="cal-card-code">{m.missionCode}</strong>
      {m.serviceLabel ? (
        <div className="cal-card-service">{m.serviceLabel}</div>
      ) : null}
      <dl className="cal-card-rows">
        <dt>{t.calendarDate}</dt>
        <dd>
          {date} · {timeRange}
        </dd>
        <dt>{t.calendarDrone}</dt>
        <dd>{drone ?? t.calendarNoDrone}</dd>
        <dt>{t.calendarPilot}</dt>
        <dd>{m.operatorName ?? t.calendarNoPilot}</dd>
        {m.orderCode ? (
          <>
            <dt>{t.calendarOrder}</dt>
            <dd>{m.orderCode}</dd>
          </>
        ) : null}
      </dl>
      <Button
        type="primary"
        size="small"
        block
        onClick={() => {
          setOpen(false)
          onSelect(m)
        }}
      >
        {t.calendarViewDetails}
      </Button>
    </div>
  )
  return (
    <Popover
      content={card}
      open={open}
      onOpenChange={setOpen}
      trigger={touch ? ['click'] : ['hover', 'focus']}
      mouseEnterDelay={0.15}
      mouseLeaveDelay={0.1}
      placement="right"
      autoAdjustOverflow
      arrow={false}
      overlayClassName="cal-card-pop"
      getPopupContainer={mgrPopupContainer}
    >
      <div
        className="cal-ev"
        role="button"
        tabIndex={0}
        aria-pressed={selected}
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
        <span className="cal-ev-time">{timeRange}</span>
        {m.serviceLabel ? (
          <span className="cal-ev-meta" title={m.serviceLabel}>
            {m.serviceLabel}
          </span>
        ) : null}
        {drone ? <span className="cal-ev-meta">{drone}</span> : null}
        <span className="cal-ev-status">
          <i className="cal-card-dot" />
          {statusLabel}
        </span>
      </div>
    </Popover>
  )
}

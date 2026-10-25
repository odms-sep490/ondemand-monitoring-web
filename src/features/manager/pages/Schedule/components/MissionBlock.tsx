import type { MissionCalendarItem } from '../../../types/missions'
import {
  toLocalHours,
  HOUR_START,
  PX_PER_HOUR,
  toneBg,
  toneFg,
} from '../scheduleHelpers'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'

// ── MissionBlock ───────────────────────────────────────────────────────────

export type MissionBlockProps = {
  mission: MissionCalendarItem
  dayIndex: number
  selected: boolean
  onSelect: (m: MissionCalendarItem) => void
  missionStatusLabel: string
}

export function MissionBlock({
  mission,
  selected,
  onSelect,
  missionStatusLabel,
}: MissionBlockProps) {
  const startH = mission.scheduledStartAt
    ? toLocalHours(mission.scheduledStartAt)
    : HOUR_START
  const endH = mission.scheduledEndAt
    ? toLocalHours(mission.scheduledEndAt)
    : startH

  const top = Math.max(0, (startH - HOUR_START) * PX_PER_HOUR)
  const height = Math.max(18, (endH - startH) * PX_PER_HOUR - 2)

  const tone = missionStatusTone[mission.status] ?? 'gray'
  const bg = toneBg[tone]
  const fg = toneFg[tone]

  return (
    <button
      type="button"
      style={{
        position: 'absolute',
        top,
        left: 2,
        right: 2,
        height,
        background: bg,
        color: fg,
        border: selected ? `2px solid ${fg}` : '1px solid transparent',
        borderRadius: 5,
        padding: '3px 5px',
        textAlign: 'left',
        fontSize: 11,
        overflow: 'hidden',
        cursor: 'pointer',
        lineHeight: 1.3,
      }}
      onClick={() => onSelect(mission)}
      aria-pressed={selected}
      aria-label={`${mission.missionCode} ${missionStatusLabel}`}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {mission.missionCode.slice(-6)}
      </div>
      {mission.droneCode && (
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: 0.8,
          }}
        >
          {mission.droneCode}
          {mission.operatorName
            ? ` · ${mission.operatorName.split(' ').at(-1)}`
            : ''}
        </div>
      )}
    </button>
  )
}

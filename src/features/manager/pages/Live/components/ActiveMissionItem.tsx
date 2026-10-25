import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { livePageMessages } from '../LivePage.messages'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'

export function ActiveMissionItem({
  mission,
  selected,
  onSelect,
}: {
  mission: MissionCalendarItem
  selected: boolean
  onSelect: () => void
}) {
  const { lang } = useI18n(livePageMessages)
  const tone = missionStatusTone[mission.status] ?? 'gray'
  const label = getMissionStatusLabel(mission.status, lang) ?? mission.status

  return (
    <button
      type="button"
      className={`odm-live-item${selected ? ' active' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--tx3)',
          marginBottom: 2,
        }}
      >
        {mission.missionCode}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 4,
        }}
      >
        {mission.serviceLabel ?? mission.addressText ?? '—'}
      </div>
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
        {mission.droneCode ?? '—'}
        {mission.operatorName
          ? ` · ${mission.operatorName.split(' ').slice(-2).join(' ')}`
          : ''}
      </div>
    </button>
  )
}

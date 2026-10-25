import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import { livePageMessages } from '../LivePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import type { StatusTone } from '../../../../../shared/types/domain'
import type { Dispatch, SetStateAction } from 'react'

export function LiveTopBar({
  mission,
  tone,
  setShowIncidentModal,
  setShowCancelModal,
}: {
  mission: MissionCalendarItem
  tone: StatusTone
  setShowIncidentModal: Dispatch<SetStateAction<boolean>>
  setShowCancelModal: Dispatch<SetStateAction<boolean>>
}) {
  const { t, lang, locale } = useI18n(livePageMessages)
  return (
    <div className="odm-live-topbar">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--tx3)',
          }}
        >
          {mission.missionCode}
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {mission.serviceLabel ?? mission.addressText ?? '—'}
        </div>
      </div>
      <StatusBadge tone={tone}>
        {getMissionStatusLabel(mission.status, lang) ?? mission.status}
      </StatusBadge>
      <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
        {mission.droneCode}
        {mission.operatorName ? ` · ${mission.operatorName}` : ''}
        {mission.scheduledStartAt
          ? t.scheduledPrefix(
              new Date(mission.scheduledStartAt).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              }),
              new Date(mission.scheduledEndAt!).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              }),
            )
          : ''}
      </div>
      <button
        type="button"
        className="odm-btn"
        onClick={() => setShowIncidentModal(true)}
      >
        {t.recordIncident}
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-rd"
        onClick={() => setShowCancelModal(true)}
      >
        {t.urgentCancel}
      </button>
    </div>
  )
}

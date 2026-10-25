import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { formatVnDate } from '../mediaHelpers'
import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaNeedsActionResponse } from '../../../types/media'
import type { Dispatch, SetStateAction } from 'react'
import type { ActiveModal } from '../mediaTypes'

export function WaitingDeliveryList({
  data,
  setModal,
}: {
  data: MediaNeedsActionResponse
  setModal: Dispatch<SetStateAction<ActiveModal>>
}) {
  const { t, lang } = useI18n(mediaPageMessages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.waitingDeliveryMissions.map((mission) => (
        <div key={mission.missionId} className="odm-card">
          <div
            className="odm-card-body"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              gap: 18,
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="odm-mono" style={{ fontWeight: 700 }}>
                  {mission.missionCode}
                </span>
                <StatusBadge tone={missionStatusTone[mission.missionStatus]}>
                  {getMissionStatusLabel(mission.missionStatus, lang)}
                </StatusBadge>
              </div>
              <div style={{ fontWeight: 600, margin: '3px 0' }}>
                {mission.missionTitle}
              </div>
              <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
                {mission.orderCode} · {mission.customerName} ·{' '}
                {mission.companyName}
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 5,
                    background: 'var(--sf3)',
                    color: 'var(--tx2)',
                    fontSize: 11.5,
                    fontWeight: 500,
                    border: '1px solid var(--bd)',
                  }}
                >
                  {mission.serviceType}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 5,
                    background: 'var(--sf3)',
                    color: 'var(--tx2)',
                    fontSize: 11.5,
                    fontWeight: 500,
                    border: '1px solid var(--bd)',
                  }}
                >
                  {t.waitTab.filesSummary(
                    mission.totalFiles,
                    mission.photoCount,
                    mission.videoCount,
                  )}
                </span>
                {mission.allValidated && (
                  <StatusBadge tone="green">{t.waitTab.validated}</StatusBadge>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 5,
                    background: 'var(--sf3)',
                    color: 'var(--tx2)',
                    fontSize: 11.5,
                    fontWeight: 500,
                    border: '1px solid var(--bd)',
                  }}
                >
                  {t.waitTab.validatedAt} {formatVnDate(mission.validatedAt)}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={() => setModal({ kind: 'deliver', mission })}
            >
              {t.waitTab.deliverToCustomer}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

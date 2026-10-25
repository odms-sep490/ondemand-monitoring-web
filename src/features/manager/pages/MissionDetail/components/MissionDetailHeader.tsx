import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { formatOrderCode } from '../../../components/common/format'
import { formatDateTime } from '../../../components/common/missionDetailHelpers'
import { managerHref } from '../../../routes'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionResponse } from '../../../types/missions'

export function MissionDetailHeader({
  mission,
  headline,
  canSetup,
}: {
  mission: MissionResponse
  headline: string | null
  canSetup: boolean
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  return (
    <div className="odm-or-pagehead odm-or-md-head">
      <div className="odm-md-headmain">
        <div className="odm-md-titlerow">
          <h1 className="odm-or-title odm-mono">{mission.missionCode}</h1>
          {missionStopLabel(mission) ? (
            <StatusBadge tone="yellow">{missionStopLabel(mission)}</StatusBadge>
          ) : (
            <StatusBadge
              kind="mission"
              status={mission.status}
              tone={missionStatusTone[mission.status]}
            />
          )}
        </div>
        <p className={`odm-or-subtitle${headline ? '' : ' is-muted'}`}>
          {headline ?? t.noDescription}
        </p>
        <div className="odm-md-meta">
          {mission.orderCode ? (
            <span>{formatOrderCode(mission.orderCode)}</span>
          ) : null}
          <span>{formatDateTime(mission.scheduledStartAt, locale)}</span>
          <a
            className="odm-or-btn-outline"
            href={managerHref({
              screen: 'orderReview',
              orderId: mission.orderId,
            })}
          >
            {t.viewOrderPlan}
            <OrderIcon name="arrow-right" size={13} />
          </a>
        </div>
      </div>
      {canSetup ? (
        <div className="odm-or-md-actions">
          <a
            className="odm-or-btn odm-or-btn-blue"
            href={managerHref({
              screen: 'missionSetup',
              missionId: mission.id,
            })}
          >
            {t.continueSetup}
          </a>
        </div>
      ) : null}
    </div>
  )
}

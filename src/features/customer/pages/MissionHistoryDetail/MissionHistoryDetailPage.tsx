import {
  ErrorState,
  LoadingState,
} from '../../components/common/StateView'
import { PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import { MissionStatusBadge } from '../../components/common/MissionStatusBadge'
import { customerHref } from '../../routes'
import { MissionInfoCard } from './components/MissionInfoCard'
import { MissionResults } from './components/MissionResults'
import { useMissionDetail } from './hooks/useMissionDetail'
import './MissionHistoryDetail.css'
import { missionHistoryDetailPageMessages } from './MissionHistoryDetailPage.messages'
import { CustomerMissionReportContent } from '../../components/reports/CustomerMissionReportPage'

/** One finished mission: `mission-history/{id}` plus its media and result counts. */
export function MissionHistoryDetailPage({ missionId }: { missionId: string }) {
  return <Detail key={missionId} missionId={missionId} />
}

function Detail({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionHistoryDetailPageMessages)
  const detail = useMissionDetail(missionId)
  const mission = detail.mission.data

  if (detail.mission.loading && !mission) return <LoadingState />
  if (!mission || detail.mission.error) {
    return (
      <ErrorState
        title={t.errorTitle}
        error={undefined}
        onRetry={detail.mission.reload}
      />
    )
  }

  return (
    <div className="mhd-page">
      <PageHeader
        back={
          <a href={customerHref({ screen: 'missionHistory' })}>
            {t.backToHistory}
          </a>
        }
        title={
          <span className="mhd-title">
            <span>{mission.orderTitle}</span>
            <MissionStatusBadge status={mission.status} />
          </span>
        }
        subtitle={mission.code}
      />
      <MissionInfoCard mission={mission} />
      <CustomerMissionReportContent
        key={mission.id}
        orderId={mission.orderId}
        missionId={mission.id}
        showMedia={false}
      />
      <CustomerDeliveryPanel orderId={mission.orderId} />
      <MissionResults detail={detail} missionCode={mission.code} />
    </div>
  )
}

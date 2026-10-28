import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { managerHref } from '../../../routes'
import {
  Button,
  EmptyState,
  Skeleton,
} from '../../../../../shared/components/ui'
import '../../../components/layout/mgrLayout.css'
import { useI18n } from '../../../../../shared/i18n'
import { missionScopedAssignmentMessages } from './MissionScopedAssignment.messages'

/** Mission list entry resolves Order context, but never asks to select the known Mission again. */
export function MissionScopedAssignmentPage({
  missionId,
}: {
  missionId: string
}) {
  const { t } = useI18n(missionScopedAssignmentMessages)
  const query = useApiQuery(
    (signal) => missionsApi.getMissionResponse(missionId, signal),
    [missionId],
  )
  const close = () => {
    window.location.hash = managerHref({ screen: 'missions' })
  }
  if (query.loading)
    return (
      <div className="mgr-page" role="status" aria-busy="true">
        <span className="odm-visually-hidden">{t.loading}</span>
        <Skeleton variant="block" height={56} />
        <Skeleton variant="block" height={320} />
      </div>
    )
  if (query.error || query.data?.id !== missionId || !query.data.orderId)
    return (
      <div className="ui-table-card mgr-page">
        <EmptyState
          title={<span role="alert">{t.loadError}</span>}
          action={
            <div className="mgr-header-actions">
              <Button onClick={query.reload}>{t.retry}</Button>
              <Button onClick={close}>{t.backToMissions}</Button>
            </div>
          }
        />
      </div>
    )
  return (
    <OrderResourceAssignmentWizard
      key={missionId}
      orderId={query.data.orderId}
      initialMissionId={missionId}
      returnLabel={t.backToMissions}
      onClose={close}
    />
  )
}

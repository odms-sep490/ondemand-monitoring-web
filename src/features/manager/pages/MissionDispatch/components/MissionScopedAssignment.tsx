import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { managerHref } from '../../../routes'

/** Mission list entry resolves Order context, but never asks to select the known Mission again. */
export function MissionScopedAssignmentPage({
  missionId,
}: {
  missionId: string
}) {
  const query = useApiQuery(
    (signal) => missionsApi.getMissionResponse(missionId, signal),
    [missionId],
  )
  const close = () => {
    window.location.hash = managerHref({ screen: 'missions' })
  }
  if (query.loading) return <p role="status">Đang tải phân công…</p>
  if (query.error || query.data?.id !== missionId || !query.data.orderId)
    return (
      <section className="odm-or-card odm-or-card-body">
        <p role="alert">Không thể tải nhiệm vụ để tiếp tục phân công.</p>
        <button className="odm-btn" onClick={query.reload}>
          Thử lại
        </button>
        <button className="odm-btn" onClick={close}>
          Về danh sách nhiệm vụ
        </button>
      </section>
    )
  return (
    <OrderResourceAssignmentWizard
      key={missionId}
      orderId={query.data.orderId}
      initialMissionId={missionId}
      returnLabel="Về danh sách nhiệm vụ"
      onClose={close}
    />
  )
}

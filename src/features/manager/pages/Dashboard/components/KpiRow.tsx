import type { ManagerDashboardData } from '../../../types/dashboard'
import { managerHref } from '../../../routes'
import { KpiCard } from './KpiCard'

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1,
})

export function KpiRow({ data }: { data: ManagerDashboardData }) {
  const s = data.summary
  return (
    <div className="odm-mgr-kpi-row">
      <KpiCard label="Tổng yêu cầu" value={s.totalOrders} detail="Trong khoảng thời gian đã chọn" href={managerHref({ screen: 'orderQueue' })} />
      <KpiCard label="Checklist chờ duyệt giá" value={s.pendingAdditionalChecklistCount} detail="Dịch vụ bổ sung cần báo giá" href={managerHref({ screen: 'orderQueue' })} tone="warning" />
      <KpiCard label="Giá trị báo giá" value={vnd.format(s.totalQuoteValue)} detail="Bản mới nhất đã duyệt/chấp nhận" href={managerHref({ screen: 'orderQueue' })} />
      <KpiCard label="Chờ thanh toán cọc" value={s.waitingDepositCount} detail="Chưa hoàn tất cọc" href={managerHref({ screen: 'orderQueue' })} tone="warning" />
      <KpiCard label="Mission đang hoạt động" value={s.activeMissionCount} detail="Nhiệm vụ đang được triển khai" href={managerHref({ screen: 'missions' })} />
      <KpiCard label="Cần chú ý" value={s.attentionRequiredCount} detail="Sự cố hoặc thiếu nguồn lực" href={managerHref({ screen: 'missions' })} tone="danger" />
    </div>
  )
}

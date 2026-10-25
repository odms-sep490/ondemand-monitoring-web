import { managerHref } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'

export function OperationalSections({ data }: { data: ManagerDashboardData }) {
  const pipeline = data.pricingPipeline
  const overview = data.missionOverview
  return (
    <>
      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">Yêu cầu gần đây</div>
        {data.recentOrders.length === 0 ? <DashboardEmpty text="Chưa có yêu cầu gần đây." /> : (
          <div className="odm-mgr-table-wrap"><table className="odm-mgr-dashboard-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Dịch vụ</th><th>Ngày tạo</th><th>Trạng thái</th><th>Dịch vụ bổ sung</th><th>Giá/Báo giá</th><th /></tr></thead><tbody>
            {data.recentOrders.map((order) => <tr key={order.orderId}>
              <td className="odm-tn">{order.orderCode}</td><td>{order.customerName}</td><td>{order.serviceName}</td><td>{formatDashboardDate(order.createdAt)}</td><td><Status value={order.status} /></td>
              <td>{order.additionalChecklistCount === 0 ? 'Không có' : <span className={order.pendingAdditionalChecklistCount ? 'odm-mgr-inline-warning' : ''}>{order.additionalChecklistCount} bổ sung{order.pendingAdditionalChecklistCount ? ` · ${order.pendingAdditionalChecklistCount} chờ duyệt` : ''}</span>}</td>
              <td>{order.pricingState === 'NEEDS_MANAGER_REVIEW' ? 'Chưa hoàn tất' : 'Đã xử lý'}</td><td><a className="odm-btn odm-btn-sm" href={managerHref({ screen: 'orderReview', orderId: order.orderId })}>Xem</a></td>
            </tr>)}</tbody></table></div>
        )}
      </section>

      <div className="odm-mgr-overview-grid">
        <section className="odm-card odm-mgr-section">
          <div className="odm-card-header">Báo giá & thanh toán</div>
          <PipelineRow label="Duyệt giá bổ sung" value={pipeline.pricingReviewCount} />
          <PipelineRow label="Báo giá sẵn sàng" value={pipeline.quoteReadyCount} />
          <PipelineRow label="Chờ khách xác nhận" value={pipeline.waitingCustomerCount} />
          <PipelineRow label="Chờ đặt cọc" value={pipeline.waitingDepositCount} />
          <PipelineRow label="Đặt cọc thành công" value={pipeline.depositPaidCount} success />
          <div className="odm-mgr-section-action"><a className="odm-btn" href={managerHref({ screen: 'orderQueue' })}>Xem tất cả báo giá</a></div>
        </section>
        <section className="odm-card odm-mgr-section">
          <div className="odm-card-header">Mission overview</div>
          <div className="odm-mgr-mission-stats">
            <PipelineRow label="Scheduled" value={overview.scheduledCount} /><PipelineRow label="Ready" value={overview.readyCount} /><PipelineRow label="In Flight" value={overview.inFlightCount} /><PipelineRow label="Returning" value={overview.returningCount} /><PipelineRow label="Completed Today" value={overview.completedTodayCount} success /><PipelineRow label="Issues" value={overview.issueCount} danger />
          </div>
          <div className="odm-mgr-section-action"><a className="odm-btn" href={managerHref({ screen: 'missions' })}>Xem tất cả nhiệm vụ</a></div>
        </section>
      </div>

      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">Mission đang hoạt động</div>
        {data.activeMissions.length === 0 ? <DashboardEmpty text="Không có nhiệm vụ đang hoạt động." /> : (
          <div className="odm-mgr-table-wrap"><table className="odm-mgr-dashboard-table"><thead><tr><th>Mission</th><th>Order</th><th>Operator</th><th>Drone</th><th>Trạng thái</th><th>Lịch chạy</th><th /></tr></thead><tbody>
            {data.activeMissions.map((mission) => <tr key={mission.missionId} className={mission.attentionRequired ? 'is-attention' : ''}><td className="odm-tn">{mission.missionCode}</td><td className="odm-tn">{mission.orderCode}</td><td>{mission.operatorName ?? 'Chưa phân công'}</td><td>{mission.droneName ?? 'Chưa phân công'}</td><td><Status value={mission.status} warning={mission.attentionRequired} /></td><td>{formatDashboardDate(mission.scheduledStartAt)}</td><td><a className="odm-btn odm-btn-sm" href={managerHref({ screen: 'missionDetail', missionId: mission.missionId })}>Xem</a></td></tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">Hoạt động gần đây</div>
        {data.recentActivities.length === 0 ? <DashboardEmpty text="Chưa có hoạt động gần đây." /> : <ol className="odm-mgr-activity-list">{data.recentActivities.map((activity) => <li key={activity.id}><time dateTime={activity.occurredAt}>{formatDashboardDate(activity.occurredAt)}</time><span>{activity.description}</span></li>)}</ol>}
      </section>
    </>
  )
}

function PipelineRow({ label, value, success, danger }: { label: string; value: number; success?: boolean; danger?: boolean }) {
  return <div className={`odm-mgr-pipeline-row ${success ? 'is-success' : ''} ${danger ? 'is-danger' : ''}`}><span>{label}</span><strong className="odm-tn">{value}</strong></div>
}

function Status({ value, warning }: { value: string; warning?: boolean }) {
  return <span className={`odm-mgr-status ${warning ? 'is-warning' : ''}`}>{statusLabel(value)}</span>
}

function DashboardEmpty({ text }: { text: string }) {
  return <div className="odm-mgr-dashboard-empty">{text}</div>
}

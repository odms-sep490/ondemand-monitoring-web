import { lazy, Suspense } from 'react'
import { Button, Tag } from 'antd'
import { customerHref } from '../../../routes'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardPageMessages } from '../DashboardPage.messages'
import type { DashboardMissionData } from '../hooks/useDashboardData'
const Scene = lazy(() => import('./OverviewScene'))
export function DashboardExperience({ data, loading }: { data?: DashboardMissionData; loading: boolean }) {
  const { lang } = useI18n(dashboardPageMessages)
  const items = data?.items ?? []
  const selected = items.find(({ mission }) => ['IN_PROGRESS', 'IN_FLIGHT', 'RETURNING'].includes(mission.status)) ?? items[0]
  return <section className="overview-experience" aria-label="Sa bàn giám sát">
    <Suspense fallback={<div className="overview-scene-state">Đang tải sa bàn…</div>}><Scene /></Suspense>
    <aside className="overview-mission"><div><span className="overview-live-dot" />{lang === 'vi' ? 'Nhiệm vụ của bạn' : 'Your mission'}</div>
      <h2>{selected?.order.title ?? (lang === 'vi' ? 'Không gian giám sát' : 'Monitoring space')}</h2>
      {selected ? <><Tag color="blue">{getMissionStatusLabel(selected.mission.status, lang)}</Tag><dl><div><dt>Mã nhiệm vụ</dt><dd>{selected.mission.missionCode}</dd></div><div><dt>Dịch vụ</dt><dd>{selected.order.serviceName ?? '—'}</dd></div><div><dt>Địa điểm</dt><dd>{selected.order.address ?? '—'}</dd></div><div><dt>Lịch dự kiến</dt><dd>{selected.mission.scheduledStartAt ? new Date(selected.mission.scheduledStartAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'Chưa lên lịch'}</dd></div></dl><Button type="primary" block href={customerHref({ screen: 'orderDetail', orderId: selected.order.id })}>Xem đơn hàng →</Button></> : <><p>{loading ? 'Đang tải nhiệm vụ…' : 'Khám phá mô hình 3D và tạo yêu cầu để bắt đầu giám sát công trình của bạn.'}</p><Button type="primary" href={customerHref({ screen: 'createOrder' })}>Tạo yêu cầu giám sát</Button></>}
      <small>Sa bàn minh họa quy trình. Thông tin nhiệm vụ lấy từ đơn hàng của bạn.</small>
    </aside>
  </section>
}

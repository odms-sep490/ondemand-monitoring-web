import { CardComponent } from '../../../../../shared/components/antd'
import { useLanguage } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ManagerDashboardResponse } from '../../../types/dashboard'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'

export function OperationsSnapshot({
  data,
}: {
  data: ManagerDashboardResponse
}) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const unavailable = vi ? 'Chưa có dữ liệu' : 'Unavailable'
  const completed = data.missionTrend?.reduce((sum, p) => sum + p.completed, 0)
  const failed = data.missionTrend?.reduce((sum, p) => sum + p.failed, 0)
  const total = (completed ?? 0) + (failed ?? 0)
  const upcoming = (data.activeMissions ?? [])
    .filter(
      (m) =>
        new Date(m.scheduledStartAt).getTime() >=
        new Date(data.generatedAt ?? Date.now()).getTime(),
    )
    .sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt))
  const items = [
    {
      label: vi ? 'Nhiệm vụ cần xử lý' : 'Missions needing attention',
      value: data.missionOverview?.issueCount,
      href: managerHref({ screen: 'missions' }),
    },
    {
      label: vi ? 'Drone sẵn sàng' : 'Ready drones',
      value: data.kpis?.dronesReady
        ? `${data.kpis.dronesReady.ready}/${data.kpis.dronesReady.total}`
        : undefined,
      href: managerHref({ screen: 'drones' }),
    },
  ]
  return (
    <section
      className="mgr-ops-snapshot"
      aria-label={vi ? 'Ưu tiên điều hành' : 'Operational priorities'}
    >
      <CardComponent title={vi ? 'Theo dõi & xử lý' : 'Monitor & act'}>
        <div className="mgr-ops-facts">
          {items.map((item) => (
            <a href={item.href} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value ?? unavailable}</strong>
            </a>
          ))}
        </div>
        <div className="mgr-ops-outcome">
          <span>
            {vi ? 'Kết quả nhiệm vụ trong kỳ' : 'Mission outcomes in period'}
          </span>
          <strong>
            {data.missionTrend
              ? `${completed} ${vi ? 'hoàn thành' : 'completed'} · ${failed} ${vi ? 'thất bại' : 'failed'}`
              : unavailable}
          </strong>
          {total > 0 && (
            <>
              <div className="mgr-ops-outcome-track">
                <span
                  style={{ width: `${((completed ?? 0) / total) * 100}%` }}
                />
              </div>
              <small>
                {vi
                  ? 'Tỷ lệ hoàn thành trên nhiệm vụ đã có kết quả'
                  : 'Completion rate for resolved missions'}
                : {Math.round(((completed ?? 0) / total) * 100)}%
              </small>
            </>
          )}
        </div>
      </CardComponent>
      <CardComponent
        title={vi ? 'Lịch bay sắp tới' : 'Upcoming flights'}
        extra={
          <a href={managerHref({ screen: 'schedule' })}>
            {vi ? 'Mở lịch bay' : 'Open schedule'}
          </a>
        }
      >
        {data.activeMissions === undefined ? (
          <p>{unavailable}</p>
        ) : upcoming.length ? (
          <ul className="mgr-ops-upcoming">
            {upcoming.map((m) => (
              <li key={m.missionId}>
                <a
                  href={managerHref({
                    screen: 'missionDetail',
                    missionId: m.missionId,
                  })}
                >
                  <strong>{m.missionCode}</strong>
                  <time>{formatDashboardDate(m.scheduledStartAt)}</time>
                  <span>{statusLabel(m.status)}</span>
                  <span>
                    {m.operatorName ??
                      (vi
                        ? 'Chưa phân công nhân sự'
                        : 'Operator unassigned')}{' '}
                    ·{' '}
                    {m.droneName ??
                      (vi ? 'Chưa gán drone' : 'Drone unassigned')}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {vi
              ? 'Chưa có lịch bay sắp tới trong danh sách nhiệm vụ đang theo dõi.'
              : 'No upcoming flights in the tracked mission list.'}
          </p>
        )}
      </CardComponent>
    </section>
  )
}

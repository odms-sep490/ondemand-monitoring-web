import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { CardComponent } from '../../../../../shared/components/antd'
import { useLanguage } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type {
  ActiveMission,
  DistributionPoint,
  MissionTrendPoint,
} from '../../../types/dashboard'
import { statusLabel, formatDashboardDate } from '../dashboardHelpers'
import { DonutChart } from './charts/DonutChart'

export function MissionDistributionPanel({
  points,
  available,
}: {
  points: DistributionPoint[]
  available: boolean
}) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  return (
    <CardComponent
      title={vi ? 'Trạng thái nhiệm vụ' : 'Mission status'}
      className="mgr-ref-distribution"
    >
      {available ? (
        <DonutChart
          points={points.map((p) => ({
            label: statusLabel(p.key),
            value: p.count,
          }))}
          empty={
            vi
              ? 'Chưa có nhiệm vụ trong kỳ này.'
              : 'No missions in this period.'
          }
          ariaLabel={(total) => `${total} ${vi ? 'nhiệm vụ' : 'missions'}`}
        />
      ) : (
        <p>{vi ? 'Chưa có dữ liệu trạng thái.' : 'Status data unavailable.'}</p>
      )}
    </CardComponent>
  )
}

export function ReferenceMissionPanel({
  missions,
}: {
  missions?: ActiveMission[]
}) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const recent = useApiQuery(
    (signal) =>
      missions?.length
        ? Promise.resolve({ items: [] })
        : missionsApi.listMissions({ signal }),
    [missions],
  )
  const latest = [...(recent.data?.items ?? [])].sort((a, b) =>
    (b.scheduledStartAt ?? '').localeCompare(a.scheduledStartAt ?? ''),
  )[0]
  const active =
    missions?.find((m) =>
      ['IN_FLIGHT', 'IN_PROGRESS', 'RETURNING'].includes(m.status),
    ) ?? missions?.[0]
  const current =
    active ??
    (latest
      ? {
          missionId: latest.id,
          missionCode: latest.missionCode,
          status: latest.status,
          scheduledStartAt: latest.scheduledStartAt ?? '',
          operatorName: latest.operatorName,
          droneName: latest.droneName ?? latest.droneCode,
        }
      : undefined)
  const missing = recent.loading
    ? vi
      ? 'Đang tải…'
      : 'Loading…'
    : vi
      ? 'Chưa phân công'
      : 'Unassigned'

  return (
    <CardComponent
      title={
        active
          ? vi
            ? 'Nhiệm vụ đang theo dõi'
            : 'Tracked mission'
          : vi
            ? 'Nhiệm vụ gần nhất'
            : 'Latest mission'
      }
      className="mgr-ref-mission"
      extra={
        <a href={managerHref({ screen: 'missions' })}>
          {vi ? 'Xem tất cả →' : 'View all →'}
        </a>
      }
    >
      <div className="mgr-ref-scene">
        <img
          className="mgr-ref-landscape"
          src="/images/dashboard-mission-3d.png"
          alt=""
        />

        <div className="mgr-ref-mission-copy">
          <strong>
            {current?.missionCode ??
              (recent.loading
                ? vi
                  ? 'Đang tải nhiệm vụ…'
                  : 'Loading mission…'
                : vi
                  ? 'Chưa có nhiệm vụ'
                  : 'No mission yet')}
          </strong>
          <span>
            {current
              ? statusLabel(current.status)
              : missions
                ? vi
                  ? 'Sẵn sàng cho lịch bay tiếp theo'
                  : 'Ready for the next flight'
                : vi
                  ? 'Chưa tải được dữ liệu'
                  : 'Data unavailable'}
          </span>
          {current && (
            <a
              href={managerHref({
                screen: 'missionDetail',
                missionId: current.missionId,
              })}
            >
              {vi ? 'Mở nhiệm vụ →' : 'Open mission →'}
            </a>
          )}
        </div>
        <small className="mgr-ref-scene-caption">
          {vi
            ? 'Hình minh họa · không phải vị trí trực tiếp'
            : 'Illustration · not a live location'}
        </small>
      </div>
      <dl className="mgr-ref-flight-facts">
        <div>
          <dt>{vi ? 'Lịch thực hiện' : 'Schedule'}</dt>
          <dd>
            {current?.scheduledStartAt
              ? formatDashboardDate(current.scheduledStartAt)
              : vi
                ? 'Chưa lên lịch'
                : 'Not scheduled'}
          </dd>
        </div>
        <div>
          <dt>{vi ? 'Nhân sự' : 'Operator'}</dt>
          <dd>{current?.operatorName ?? missing}</dd>
        </div>
        <div>
          <dt>{vi ? 'Thiết bị' : 'Drone'}</dt>
          <dd>{current?.droneName ?? missing}</dd>
        </div>
      </dl>
      {current && (
        <div className="mgr-ref-mission-summary">
          <div>
            <span>{vi ? 'Trạng thái nhiệm vụ' : 'Mission status'}</span>
            <strong>{statusLabel(current.status)}</strong>
          </div>
          <div>
            <span>{vi ? 'Mã nhiệm vụ' : 'Mission code'}</span>
            <strong>{current.missionCode}</strong>
          </div>
          {!active && (
            <p>
              {vi
                ? 'Đang hiển thị nhiệm vụ gần nhất vì không có nhiệm vụ hoạt động.'
                : 'Showing the latest mission because none is currently active.'}
            </p>
          )}
        </div>
      )}
      {Boolean(recent.error) && !active && (
        <p role="status">
          {vi
            ? 'Không tải được nhiệm vụ gần nhất.'
            : 'Could not load the latest mission.'}{' '}
          <button type="button" onClick={recent.reload}>
            {vi ? 'Thử lại' : 'Retry'}
          </button>
        </p>
      )}
    </CardComponent>
  )
}

export function PerformancePanel({ points }: { points?: MissionTrendPoint[] }) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const rows = points ?? []
  const max = Math.max(1, ...rows.map((p) => p.completed + p.failed))
  return (
    <CardComponent
      title={vi ? 'Hiệu suất nhiệm vụ' : 'Mission performance'}
      className="mgr-ref-performance"
    >
      {rows.length ? (
        <>
          <div className="mgr-ref-bars">
            {rows.map((p) => (
              <div key={p.periodStart}>
                <div className="mgr-ref-bar-track">
                  <span
                    style={{ height: `${(p.completed / max) * 100}%` }}
                    title={`${vi ? 'Hoàn thành' : 'Completed'}: ${p.completed}`}
                  />
                  <span
                    style={{ height: `${(p.failed / max) * 100}%` }}
                    title={`${vi ? 'Thất bại' : 'Failed'}: ${p.failed}`}
                  />
                </div>
                <strong>{p.completed + p.failed}</strong>
                <small>{p.periodStart.slice(5)}</small>
              </div>
            ))}
          </div>
          <p className="mgr-ref-bar-key">
            {vi
              ? 'Xanh: hoàn thành · Cam: thất bại'
              : 'Blue: completed · Amber: failed'}
          </p>
        </>
      ) : (
        <p>
          {vi
            ? 'Chưa có kết quả nhiệm vụ trong kỳ này.'
            : 'No mission outcomes in this period.'}
        </p>
      )}
    </CardComponent>
  )
}

import {
  CalendarOutlined,
  RocketOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Tag } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../../../shared/i18n'
import { missionsApi } from '../../../api/missionsApi'
import { managerHref } from '../../../routes'
import type {
  ActiveMission,
  DistributionPoint,
  MissionTrendPoint,
} from '../../../types/dashboard'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'
import { statusChartColor } from '../dashboardTone'
import { DashboardEmptyState } from './DashboardEmptyState'
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
            key: p.key,
            label: statusLabel(p.key),
            value: p.count,
          }))}
          centerCaption={vi ? 'nhiệm vụ' : 'missions'}
          empty={
            vi
              ? 'Chưa có nhiệm vụ trong kỳ này.'
              : 'No missions in this period.'
          }
          ariaLabel={(total) => `${total} ${vi ? 'nhiệm vụ' : 'missions'}`}
        />
      ) : (
        <DashboardEmptyState
          variant="NO_DATA"
          title={vi ? 'Chưa có dữ liệu trạng thái.' : 'Status data unavailable.'}
        />
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
      className="mgr-ref-mission mgr-mission-compact-card"
      extra={
        <a
          className="mgr-card-link"
          href={managerHref({ screen: 'missions' })}
        >
          {vi ? 'Xem tất cả' : 'View all'}
        </a>
      }
    >
      {Boolean(recent.error) && !active ? (
        <DashboardEmptyState
          variant="ERROR"
          title={
            vi
              ? 'Không tải được nhiệm vụ gần nhất.'
              : 'Could not load the latest mission.'
          }
          actionLabel={vi ? 'Thử lại' : 'Retry'}
          onAction={recent.reload}
        />
      ) : !current ? (
        <DashboardEmptyState
          variant="NO_MISSIONS"
          title={
            recent.loading
              ? vi
                ? 'Đang tải nhiệm vụ…'
                : 'Loading mission…'
              : vi
                ? 'Chưa có nhiệm vụ đang chạy'
                : 'No active mission yet'
          }
          description={
            recent.loading
              ? undefined
              : missions
                ? vi
                  ? 'Hệ thống sẵn sàng cho lịch bay tiếp theo. Kiểm tra hàng đợi đơn để lập kế hoạch nhiệm vụ.'
                  : 'Ready for the next flight. Review the order queue to schedule upcoming missions.'
                : vi
                  ? 'Chưa tải được dữ liệu nhiệm vụ.'
                  : 'Mission data unavailable.'
          }
          actionLabel={
            recent.loading
              ? undefined
              : vi
                ? 'Xem danh sách nhiệm vụ'
                : 'View missions'
          }
          actionHref={
            recent.loading ? undefined : managerHref({ screen: 'missions' })
          }
        />
      ) : (
        <div className="mgr-mission-compact">
          <div className="mgr-mission-compact-head">
            <div className="mgr-mission-compact-id">
              <span className="mgr-mission-badge-icon" aria-hidden="true">
                <RocketOutlined />
              </span>
              <div>
                <div className="mgr-mission-code-row">
                  <strong className="mgr-mission-code">
                    {current.missionCode}
                  </strong>
                  <Tag color={statusChartColor(current.status)}>
                    {statusLabel(current.status)}
                  </Tag>
                </div>
                {!active ? (
                  <p className="mgr-mission-subnote">
                    {vi
                      ? 'Hiển thị nhiệm vụ gần nhất do chưa có nhiệm vụ đang bay.'
                      : 'Showing latest mission as none is currently in flight.'}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              href={managerHref({
                screen: 'missionDetail',
                missionId: current.missionId,
              })}
            >
              {vi ? 'Mở nhiệm vụ' : 'Open mission'}
            </Button>
          </div>

          <dl className="mgr-mission-facts-grid">
            <div className="mgr-mission-fact-tile">
              <dt>
                <CalendarOutlined aria-hidden="true" />{' '}
                {vi ? 'Lịch thực hiện' : 'Schedule'}
              </dt>
              <dd>
                {current.scheduledStartAt
                  ? formatDashboardDate(current.scheduledStartAt)
                  : vi
                    ? 'Chưa lên lịch'
                    : 'Not scheduled'}
              </dd>
            </div>
            <div className="mgr-mission-fact-tile">
              <dt>
                <UserOutlined aria-hidden="true" />{' '}
                {vi ? 'Nhân sự' : 'Operator'}
              </dt>
              <dd>{current.operatorName ?? missing}</dd>
            </div>
            <div className="mgr-mission-fact-tile">
              <dt>
                <RocketOutlined aria-hidden="true" />{' '}
                {vi ? 'Thiết bị' : 'Drone'}
              </dt>
              <dd>{current.droneName ?? missing}</dd>
            </div>
          </dl>
        </div>
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
        <DashboardEmptyState
          variant="NO_DATA"
          title={
            vi
              ? 'Chưa có kết quả nhiệm vụ trong kỳ này.'
              : 'No mission outcomes in this period.'
          }
        />
      )}
    </CardComponent>
  )
}

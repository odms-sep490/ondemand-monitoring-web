import {
  CalendarOutlined,
  RocketOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Badge, Button, Tag } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../../../shared/i18n'
import { missionsApi } from '../../../api/missionsApi'
import { managerHref } from '../../../routes'
import { MANAGER_COLORS } from '../../../theme/managerTheme'
import type {
  ActiveMission,
  DistributionPoint,
  MissionOverview,
  MissionTrendPoint,
} from '../../../types/dashboard'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'
import { statusChartColor } from '../dashboardTone'
import { DashboardEmptyState } from './DashboardEmptyState'
import { DonutChart } from './charts/DonutChart'

const MAX_VISIBLE_MISSIONS = 6

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
  overview,
}: {
  missions?: ActiveMission[]
  overview?: MissionOverview
}) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const [isExpanded, setIsExpanded] = useState(false)
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

  const priorityRank = (status: string) =>
    ['IN_FLIGHT', 'IN_PROGRESS', 'RETURNING'].includes(status) ? 0 : 1

  const activeList = missions?.length
    ? [...missions].sort(
        (a, b) => priorityRank(a.status) - priorityRank(b.status),
      )
    : []

  const isFallback = activeList.length === 0 && Boolean(latest)
  const items = activeList.length
    ? activeList
    : latest
      ? [
          {
            missionId: latest.id,
            missionCode: latest.missionCode,
            orderId: '',
            orderCode: '',
            status: latest.status,
            scheduledStartAt: latest.scheduledStartAt ?? '',
            operatorName: latest.operatorName ?? null,
            droneName: latest.droneName ?? latest.droneCode ?? null,
            attentionRequired: false,
          },
        ]
      : []

  const visibleItems = isExpanded
    ? items
    : items.slice(0, MAX_VISIBLE_MISSIONS)
  const hiddenCount = items.length - visibleItems.length

  const overviewChips = overview
    ? [
        {
          key: 'inFlight',
          label: vi ? 'Đang bay' : 'In flight',
          value: overview.inFlightCount + overview.returningCount,
          tone: 'is-blue',
        },
        {
          key: 'ready',
          label: vi ? 'Sẵn sàng' : 'Ready',
          value: overview.readyCount,
          tone: 'is-emerald',
        },
        {
          key: 'scheduled',
          label: vi ? 'Đã lên lịch' : 'Scheduled',
          value: overview.scheduledCount,
          tone: 'is-neutral',
        },
        {
          key: 'issue',
          label: vi ? 'Cần chú ý' : 'Issues',
          value: overview.issueCount,
          tone: overview.issueCount > 0 ? 'is-danger' : 'is-neutral',
        },
      ]
    : []
  const hasOverviewCounts = overviewChips.some((chip) => chip.value > 0)
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
        !isFallback
          ? vi
            ? 'Nhiệm vụ đang theo dõi'
            : 'Tracked missions'
          : vi
            ? 'Nhiệm vụ gần nhất'
            : 'Latest mission'
      }
      className="mgr-ref-mission mgr-mission-compact-card"
      extra={
        <div className="mgr-card-extra-group">
          <Badge
            count={items.length}
            showZero
            color={items.length > 0 ? MANAGER_COLORS.primary : '#94A3B8'}
          />
          <a
            className="mgr-card-link"
            href={managerHref({ screen: 'missions' })}
          >
            {vi ? 'Xem tất cả' : 'View all'}
          </a>
        </div>
      }
    >
      {Boolean(recent.error) && activeList.length === 0 ? (
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
      ) : items.length === 0 ? (
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
        <>
          {isFallback ? (
            <p className="mgr-mission-subnote mgr-mission-fallback-note">
              {vi
                ? 'Hiển thị nhiệm vụ gần nhất do chưa có nhiệm vụ đang bay.'
                : 'Showing latest mission as none is currently in flight.'}
            </p>
          ) : null}
          <div className="mgr-scroll-list">
            <ul className="m-0 list-none p-0">
              {visibleItems.map((m) => {
                const accent = statusChartColor(m.status)
                const isLive = [
                  'IN_FLIGHT',
                  'IN_PROGRESS',
                  'RETURNING',
                ].includes(m.status)
                return (
                  <li key={m.missionId} className="mgr-dash-row mgr-task-row">
                    <span
                      className="mgr-task-icon"
                      style={{
                        color: accent,
                        background: `${accent}14`,
                      }}
                      aria-hidden="true"
                    >
                      <RocketOutlined />
                    </span>
                    <div className="mgr-dash-row-main">
                      <div className="mgr-dash-row-title mgr-mission-row-title">
                        <span>{m.missionCode}</span>
                        <Tag color={accent}>{statusLabel(m.status)}</Tag>
                      </div>
                      <div className="mgr-dash-row-description mgr-mission-row-facts">
                        <span>
                          <CalendarOutlined aria-hidden="true" />{' '}
                          {m.scheduledStartAt
                            ? formatDashboardDate(m.scheduledStartAt)
                            : vi
                              ? 'Chưa lên lịch'
                              : 'Not scheduled'}
                        </span>
                        <span>·</span>
                        <span>
                          <UserOutlined aria-hidden="true" />{' '}
                          {m.operatorName ?? missing}
                        </span>
                      </div>
                      <div className="mgr-dash-row-meta">
                        {m.orderCode ? (
                          <span className="mgr-task-code">{m.orderCode}</span>
                        ) : null}
                        <span>{m.droneName ?? missing}</span>
                      </div>
                    </div>
                    <Button
                      size="small"
                      type={isLive ? 'primary' : 'default'}
                      href={managerHref({
                        screen: 'missionDetail',
                        missionId: m.missionId,
                      })}
                    >
                      {vi ? 'Mở nhiệm vụ' : 'Open mission'}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
          {items.length > MAX_VISIBLE_MISSIONS ? (
            <Button
              type="link"
              size="small"
              className="mgr-action-more"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded
                ? vi
                  ? 'Thu gọn'
                  : 'Show less'
                : vi
                  ? `Xem tất cả ${hiddenCount} nhiệm vụ còn lại`
                  : `Show ${hiddenCount} more missions`}
            </Button>
          ) : items.length === 1 && hasOverviewCounts ? (
            <div className="mgr-mission-overview-strip">
              {overviewChips.map((chip) => (
                <div
                  key={chip.key}
                  className={`mgr-mission-overview-chip ${chip.tone}`}
                >
                  <span>{chip.label}</span>
                  <strong>{chip.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </>
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

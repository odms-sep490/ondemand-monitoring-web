import {
  AlertOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Skeleton } from 'antd'
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  DroneHealthResponse,
  OverviewResponse,
  StaffWorkloadResponse,
} from '../types'
import { StaffWorkloadChart } from './StaffWorkloadChart'

interface OverviewTabProps {
  overview: OverviewResponse | null
  drones?: DroneHealthResponse[]
  staff?: StaffWorkloadResponse[]
  loading: boolean
}

function toHours(seconds: number | null | undefined): number {
  if (seconds == null || seconds <= 0) return 0
  return Math.round((seconds / 3600) * 100) / 100
}

type DronePoint = {
  name: string
  fullName: string
  lifetimeHours: number
  sinceMaintenanceHours: number
  cycles: number
}

function DroneHoursTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DronePoint }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0].payload
  return (
    <div className="rl-tooltip">
      <div className="rl-tooltip-title">{d.fullName}</div>
      <div className="rl-tooltip-row">
        <span>Tổng giờ tích lũy</span>
        <strong>{d.lifetimeHours} giờ</strong>
      </div>
      <div className="rl-tooltip-row">
        <span>Từ lần bảo trì gần nhất</span>
        <strong>{d.sinceMaintenanceHours} giờ</strong>
      </div>
      <div className="rl-tooltip-row">
        <span>Số chu kỳ bay</span>
        <strong>{d.cycles} chu kỳ</strong>
      </div>
    </div>
  )
}

export function OverviewTab({
  overview,
  drones = [],
  staff = [],
  loading,
}: OverviewTabProps) {
  if (loading && !overview) {
    return <Skeleton active paragraph={{ rows: 6 }} />
  }

  const totalDevices = overview?.totalDevices ?? drones.length
  const warningDevices = overview?.warningDevices ?? 0
  const blockedDevices = overview?.blockedDevices ?? 0
  const healthyDevices = Math.max(
    0,
    totalDevices - blockedDevices - warningDevices,
  )
  const readyPct =
    totalDevices > 0 ? Math.round((healthyDevices / totalDevices) * 100) : 0
  const warnPct =
    totalDevices > 0 ? Math.round((warningDevices / totalDevices) * 100) : 0
  const blockPct =
    totalDevices > 0 ? Math.round((blockedDevices / totalDevices) * 100) : 0

  const healthSlices = [
    { name: 'Ổn định', value: healthyDevices, pct: readyPct, color: '#10b981' },
    {
      name: 'Sắp bảo trì / Theo dõi',
      value: warningDevices,
      pct: warnPct,
      color: '#f59e0b',
    },
    {
      name: 'Đang khóa bảo trì',
      value: blockedDevices,
      pct: blockPct,
      color: '#ef4444',
    },
  ]
  const nonZeroHealth = healthSlices.filter((s) => s.value > 0)

  const droneHoursData: DronePoint[] = drones.slice(0, 10).map((d, idx) => ({
    name:
      d.deviceName.length > 13
        ? `${d.deviceName.slice(0, 12)}…`
        : d.deviceName || `Drone ${idx + 1}`,
    fullName: d.deviceName,
    lifetimeHours: toHours(d.lifetimeActualSeconds),
    sinceMaintenanceHours: toHours(d.sinceMaintenanceSeconds),
    cycles: d.sinceMaintenanceCycles,
  }))

  const openAlerts = overview?.openAlerts ?? 0
  const totalStaff = overview?.totalStaff ?? staff.length
  const warnStaff = overview?.warningStaff ?? 0
  const blockedStaff = overview?.blockedStaff ?? 0

  return (
    <div className="rl-overview-deck">
      {/* Asymmetric Bento Telemetry Hero */}
      <div className="rl-bento-top">
        <div className="rl-readiness-hero">
          <div className="rl-readiness-top">
            <div>
              <div className="rl-readiness-eyebrow">
                Sẵn sàng khai thác đội Drone
              </div>
              <div className="rl-readiness-metric">
                <span className="rl-readiness-pct">{readyPct}%</span>
                <span className="rl-readiness-total">
                  {healthyDevices}/{totalDevices} drone ổn định
                </span>
              </div>
            </div>
            <span className="rl-readiness-badge">
              <RocketOutlined />
              <span>{totalDevices} Drone</span>
            </span>
          </div>

          <div className="rl-spectrum-bar" aria-label="Phân bố sức khỏe">
            {readyPct > 0 && (
              <div
                className="rl-spectrum-seg"
                style={{ width: `${readyPct}%`, background: '#10b981' }}
              />
            )}
            {warnPct > 0 && (
              <div
                className="rl-spectrum-seg"
                style={{ width: `${warnPct}%`, background: '#f59e0b' }}
              />
            )}
            {blockPct > 0 && (
              <div
                className="rl-spectrum-seg"
                style={{ width: `${blockPct}%`, background: '#ef4444' }}
              />
            )}
          </div>

          <div className="rl-readiness-foot">
            <span className="rl-readiness-item">
              <span
                className="rl-status-dot"
                style={{ background: '#10b981' }}
              />
              {healthyDevices} ổn định
            </span>
            <span className="rl-readiness-item">
              <span
                className="rl-status-dot"
                style={{ background: '#f59e0b' }}
              />
              {warningDevices} theo dõi
            </span>
            <span className="rl-readiness-item">
              <span
                className="rl-status-dot"
                style={{ background: '#ef4444' }}
              />
              {blockedDevices} khóa bảo trì
            </span>
          </div>
        </div>

        <div className="rl-tile">
          <div className="rl-tile-head">
            <span className="rl-tile-label">Nhân sự vận hành</span>
            <span
              className="rl-tile-icon"
              style={{ background: '#f5f3ff', color: '#7c3aed' }}
            >
              <TeamOutlined />
            </span>
          </div>
          <div className="rl-tile-value">{totalStaff}</div>
          <div className="rl-tile-meta">
            <span
              className="rl-pill-stat"
              style={{ background: '#fef3c7', color: '#b45309' }}
            >
              {warnStaff} tải cao
            </span>
            <span
              className="rl-pill-stat"
              style={{ background: '#fee2e2', color: '#b91c1c' }}
            >
              {blockedStaff} quá ngưỡng
            </span>
          </div>
        </div>

        <div className="rl-tile">
          <div className="rl-tile-head">
            <span className="rl-tile-label">Cảnh báo đang mở</span>
            <span
              className="rl-tile-icon"
              style={{
                background: openAlerts > 0 ? '#fef2f2' : '#ecfdf5',
                color: openAlerts > 0 ? '#dc2626' : '#059669',
              }}
            >
              <AlertOutlined />
            </span>
          </div>
          <div className="rl-tile-value">{openAlerts}</div>
          <div className="rl-tile-meta">
            <span
              className="rl-pill-stat"
              style={{ background: '#f1f5f9', color: '#475569' }}
            >
              {overview?.activeMaintenanceCycles ?? 0} chu kỳ bảo trì
            </span>
          </div>
        </div>

        <div className="rl-tile">
          <div className="rl-tile-head">
            <span className="rl-tile-label">Chính sách kích hoạt</span>
            <span
              className="rl-tile-icon"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              <SafetyCertificateOutlined />
            </span>
          </div>
          <div className="rl-tile-value">{overview?.activePolicies ?? 0}</div>
          <div className="rl-tile-meta">
            <span
              className="rl-pill-stat"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              Đang áp dụng giám sát
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row: Semi-Circle Telemetry Gauge + Smooth Area/Line Drone Hours */}
      <div className="rl-charts-grid">
        <Card className="rl-chart-card" title="Phân bố sức khỏe đội Drone">
          {nonZeroHealth.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có dữ liệu sức khỏe drone</strong>
              <span>Dữ liệu sẽ tự cập nhật khi có thiết bị trong hệ thống.</span>
            </div>
          ) : (
            <div className="rl-gauge-layout">
              <div className="rl-gauge-wrap">
                <ResponsiveContainer width="100%" height={148}>
                  <PieChart>
                    <Pie
                      data={nonZeroHealth}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="90%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={74}
                      outerRadius={106}
                      paddingAngle={3}
                      cornerRadius={6}
                    >
                      {nonZeroHealth.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`${val ?? 0} drone`, 'Số lượng']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="rl-gauge-center">
                  <strong>{readyPct}%</strong>
                  <span>{totalDevices} drone sẵn sàng</span>
                </div>
              </div>

              <div className="rl-health-bars">
                {healthSlices.map((item) => (
                  <div key={item.name} className="rl-health-row">
                    <div className="rl-health-row-top">
                      <span className="rl-health-name">
                        <span
                          className="rl-status-dot"
                          style={{ background: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="rl-health-val">
                        {item.value} ({item.pct}%)
                      </span>
                    </div>
                    <div className="rl-health-track">
                      <div
                        className="rl-health-fill"
                        style={{
                          width: `${item.pct}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card
          className="rl-chart-card"
          title="Giờ hoạt động theo từng Drone (giờ)"
        >
          {droneHoursData.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có lịch sử giờ bay drone</strong>
              <span>
                Hoàn thành nhiệm vụ hoặc ghi nhận sử dụng để hiển thị biểu đồ.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={268}>
              <ComposedChart
                data={droneHoursData}
                margin={{ top: 14, right: 16, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="rlLifetimeGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={44}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11.5, fill: '#64748b' }}
                  unit="h"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DroneHoursTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={28}
                  formatter={(value) =>
                    value === 'lifetimeHours'
                      ? 'Tổng giờ tích lũy'
                      : 'Từ lần bảo trì gần nhất'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="lifetimeHours"
                  stroke="#2563eb"
                  strokeWidth={2.4}
                  fill="url(#rlLifetimeGrad)"
                  activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="sinceMaintenanceHours"
                  stroke="#0d9488"
                  strokeWidth={2.4}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#0d9488', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <StaffWorkloadChart staff={staff} />
    </div>
  )
}

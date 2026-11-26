import {
  AlertOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Progress, Skeleton, Tag } from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

  const healthSlices = [
    { name: 'Ổn định', value: healthyDevices, color: '#10b981' },
    { name: 'Sắp bảo trì / Theo dõi', value: warningDevices, color: '#f59e0b' },
    { name: 'Đang khóa bảo trì', value: blockedDevices, color: '#ef4444' },
  ]
  const nonZeroHealth = healthSlices.filter((s) => s.value > 0)

  const droneHoursData = drones.slice(0, 10).map((d) => ({
    name: d.deviceName.length > 16 ? `${d.deviceName.slice(0, 15)}…` : d.deviceName,
    fullName: d.deviceName,
    lifetimeHours: toHours(d.lifetimeActualSeconds),
    sinceMaintenanceHours: toHours(d.sinceMaintenanceSeconds),
    cycles: d.sinceMaintenanceCycles,
  }))

  const staffWorkloadData = staff.slice(0, 8).map((s) => ({
    name: s.fullName.length > 18 ? `${s.fullName.slice(0, 17)}…` : s.fullName,
    utilization: Math.min(100, Math.round(s.maxUtilizationPercent ?? 0)),
    status: s.workloadStatus,
    weeklyHours: toHours((s.weeklyActualSeconds ?? 0) + (s.weeklyEstimatedSeconds ?? 0)),
  }))
  // Without an active WORKFORCE policy there is no limit to compare against, so show hours instead of %.
  const staffHasPolicy = staff.some((s) => s.activePolicyId)
  const staffBarKey = staffHasPolicy ? 'utilization' : 'weeklyHours'
  const maxWeeklyHours = Math.max(1, ...staffWorkloadData.map((s) => s.weeklyHours))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 4 Vivid KPI Cards */}
      <div className="rl-hero-grid">
        <div
          className="rl-kpi-card"
          style={
            {
              '--rl-accent': '#2563eb',
              '--rl-icon-bg': '#eff6ff',
            } as React.CSSProperties
          }
        >
          <div className="rl-kpi-top">
            <span className="rl-kpi-label">Tổng số Drone</span>
            <span className="rl-kpi-icon">
              <RocketOutlined />
            </span>
          </div>
          <div className="rl-kpi-value">{totalDevices}</div>
          <div className="rl-kpi-sub">
            <Tag color="green">{healthyDevices} ổn định</Tag>
            {warningDevices > 0 && <Tag color="gold">{warningDevices} theo dõi</Tag>}
            {blockedDevices > 0 && <Tag color="red">{blockedDevices} khóa</Tag>}
          </div>
        </div>

        <div
          className="rl-kpi-card"
          style={
            {
              '--rl-accent': '#10b981',
              '--rl-icon-bg': '#ecfdf5',
            } as React.CSSProperties
          }
        >
          <div className="rl-kpi-top">
            <span className="rl-kpi-label">Tỷ lệ sẵn sàng bay</span>
            <span className="rl-kpi-icon">
              <CheckCircleOutlined />
            </span>
          </div>
          <div className="rl-kpi-value">{readyPct}%</div>
          <div className="rl-kpi-sub" style={{ width: '100%' }}>
            <Progress
              percent={readyPct}
              size="small"
              showInfo={false}
              strokeColor="#10b981"
              style={{ margin: 0, width: '100%' }}
            />
          </div>
        </div>

        <div
          className="rl-kpi-card"
          style={
            {
              '--rl-accent': '#7c3aed',
              '--rl-icon-bg': '#f5f3ff',
            } as React.CSSProperties
          }
        >
          <div className="rl-kpi-top">
            <span className="rl-kpi-label">Nhân sự vận hành</span>
            <span className="rl-kpi-icon">
              <TeamOutlined />
            </span>
          </div>
          <div className="rl-kpi-value">{overview?.totalStaff ?? staff.length}</div>
          <div className="rl-kpi-sub">
            <Tag color="gold">{overview?.warningStaff ?? 0} tải cao</Tag>
            <Tag color="red">{overview?.blockedStaff ?? 0} quá ngưỡng</Tag>
          </div>
        </div>

        <div
          className="rl-kpi-card"
          style={
            {
              '--rl-accent':
                (overview?.openAlerts ?? 0) > 0 ? '#ef4444' : '#0ea5e9',
              '--rl-icon-bg':
                (overview?.openAlerts ?? 0) > 0 ? '#fef2f2' : '#f0f9ff',
            } as React.CSSProperties
          }
        >
          <div className="rl-kpi-top">
            <span className="rl-kpi-label">Cảnh báo & Chính sách</span>
            <span className="rl-kpi-icon">
              <AlertOutlined />
            </span>
          </div>
          <div className="rl-kpi-value">{overview?.openAlerts ?? 0}</div>
          <div className="rl-kpi-sub">
            <Tag color="blue">
              {overview?.activePolicies ?? 0} chính sách kích hoạt
            </Tag>
            <Tag>{overview?.activeMaintenanceCycles ?? 0} chu kỳ bảo trì</Tag>
          </div>
        </div>
      </div>

      {/* Charts Row: Fleet Health Donut + Drone Flight Hours Bar Chart */}
      <div className="rl-charts-grid">
        <Card className="rl-chart-card" title="Phân bố sức khỏe đội Drone">
          {nonZeroHealth.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có dữ liệu sức khỏe drone</strong>
              <span>Dữ liệu sẽ tự cập nhật khi có thiết bị trong hệ thống.</span>
            </div>
          ) : (
            <div className="rl-donut-wrap">
              <div className="rl-donut-box">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={nonZeroHealth}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={3}
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
                <div className="rl-donut-center">
                  <strong>{totalDevices}</strong>
                  <span>drone</span>
                </div>
              </div>
              <ul className="rl-legend-list">
                {healthSlices.map((item) => {
                  const pct =
                    totalDevices > 0
                      ? Math.round((item.value / totalDevices) * 100)
                      : 0
                  return (
                    <li key={item.name} className="rl-legend-item">
                      <span
                        className="rl-legend-dot"
                        style={{ background: item.color }}
                      />
                      <span>{item.name}</span>
                      <strong>
                        {item.value} ({pct}%)
                      </strong>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Card>

        <Card className="rl-chart-card" title="Giờ hoạt động theo từng Drone (giờ)">
          {droneHoursData.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có lịch sử giờ bay drone</strong>
              <span>Hoàn thành nhiệm vụ hoặc ghi nhận sử dụng để hiển thị biểu đồ.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={droneHoursData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11.5 }} />
                <YAxis tick={{ fontSize: 11.5 }} unit="h" />
                <Tooltip
                  formatter={(value, name) => [
                    `${value ?? 0} giờ`,
                    name === 'lifetimeHours'
                      ? 'Tổng giờ tích lũy'
                      : 'Từ lần bảo trì gần nhất',
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === 'lifetimeHours'
                      ? 'Tổng giờ tích lũy'
                      : 'Từ lần bảo trì gần nhất'
                  }
                />
                <Bar
                  dataKey="lifetimeHours"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="sinceMaintenanceHours"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Staff Workload Bar Chart */}
      <Card
        className="rl-chart-card"
        title={
          staffHasPolicy
            ? 'Mức tải công việc nhân sự (% giới hạn)'
            : 'Giờ làm việc nhân sự tuần này (giờ)'
        }
        extra={
          staffHasPolicy ? null : (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Chưa có chính sách giới hạn giờ làm
            </span>
          )
        }
      >
        {staffWorkloadData.length === 0 ? (
          <div className="rl-empty-chart">
            <strong>Chưa có dữ liệu tải công việc nhân sự</strong>
            <span>Chỉ số tải tuần của phi công và kỹ thuật viên sẽ hiển thị tại đây.</span>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(180, staffWorkloadData.length * 36 + 32)}
          >
            <BarChart
              data={staffWorkloadData}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                domain={staffHasPolicy ? [0, 100] : [0, Math.ceil(maxWeeklyHours)]}
                unit={staffHasPolicy ? '%' : 'h'}
                tick={{ fontSize: 11.5 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) =>
                  staffHasPolicy
                    ? [`${value ?? 0}%`, 'Mức sử dụng']
                    : [`${value ?? 0} giờ`, 'Giờ làm tuần này']
                }
              />
              <Bar dataKey={staffBarKey} radius={[0, 6, 6, 0]} maxBarSize={20}>
                {staffWorkloadData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.status === 'BLOCKED' || entry.utilization >= 95
                        ? '#ef4444'
                        : entry.status === 'WARNING' || entry.utilization >= 75
                          ? '#f59e0b'
                          : '#10b981'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Card, Input, Progress, Table, Tag, Typography } from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatHoursOrUnknown,
  formatPercentOrUnknown,
  reasonVi,
  statusTagColor,
} from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type { StaffWorkloadResponse } from '../types'

interface StaffWorkloadTabProps {
  staff: StaffWorkloadResponse[]
  loading: boolean
}

function toHours(seconds: number | null | undefined): number {
  if (!seconds || seconds <= 0) return 0
  return Math.round((seconds / 3600) * 100) / 100
}

export function StaffWorkloadTab({ staff, loading }: StaffWorkloadTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [search, setSearch] = useState('')

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }, [staff, search])

  const chartData = useMemo(
    () =>
      staff.slice(0, 10).map((s) => ({
        name: s.fullName.length > 15 ? `${s.fullName.slice(0, 14)}…` : s.fullName,
        weeklyActual: toHours(s.weeklyActualSeconds),
        weeklyEstimated: toHours(s.weeklyEstimatedSeconds),
      })),
    [staff],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card className="rl-chart-card" title="Giờ làm việc tuần này theo nhân sự (giờ)">
        {chartData.length === 0 ? (
          <div className="rl-empty-chart">
            <strong>Chưa có dữ liệu nhân sự</strong>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11.5 }} />
              <YAxis tick={{ fontSize: 11.5 }} unit="h" />
              <Tooltip
                formatter={(v, name) => [
                  `${v ?? 0} giờ`,
                  name === 'weeklyActual' ? 'Thực tế tuần này' : 'Ước tính tuần này',
                ]}
              />
              <Legend
                formatter={(v) =>
                  v === 'weeklyActual' ? 'Thực tế tuần này' : 'Ước tính tuần này'
                }
              />
              <Bar dataKey="weeklyActual" stackId="w" fill="#7c3aed" radius={[0, 0, 0, 0]} maxBarSize={30} />
              <Bar dataKey="weeklyEstimated" stackId="w" fill="#c4b5fd" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="rl-chart-card" title={`Chi tiết khối lượng nhân sự (${filteredStaff.length})`}>
        <div className="rl-toolbar">
          <Input.Search
            allowClear
            placeholder="Tìm theo tên hoặc email nhân sự…"
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table<StaffWorkloadResponse>
          rowKey="staffId"
          loading={loading}
          dataSource={filteredStaff}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Nhân sự',
              render: (_, row) => (
                <div className="rl-entity-cell">
                  <span className="rl-avatar">
                    {(row.fullName || 'S').charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{row.fullName}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{row.email}</div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              render: (_, row) => (
                <Tag color={statusTagColor(row.workloadStatus)}>
                  {t.statuses[row.workloadStatus as keyof typeof t.statuses] ??
                    row.workloadStatus}
                </Tag>
              ),
            },
            {
              title: 'Hôm nay (Thực tế / Ước tính)',
              render: (_, row) =>
                `${formatHoursOrUnknown(row.dailyActualSeconds)} / ${formatHoursOrUnknown(row.dailyEstimatedSeconds)}`,
            },
            {
              title: 'Tuần này (Thực tế / Ước tính)',
              render: (_, row) =>
                `${formatHoursOrUnknown(row.weeklyActualSeconds)} / ${formatHoursOrUnknown(row.weeklyEstimatedSeconds)}`,
            },
            {
              title: 'Tháng này (Thực tế / Ước tính)',
              render: (_, row) =>
                `${formatHoursOrUnknown(row.monthlyActualSeconds)} / ${formatHoursOrUnknown(row.monthlyEstimatedSeconds)}`,
            },
            {
              title: 'Thời gian nghỉ gần nhất',
              render: (_, row) =>
                formatHoursOrUnknown(row.restSecondsBeforeNextMission, t.unknown),
            },
            {
              title: 'Mức sử dụng',
              render: (_, row) => {
                const pct =
                  row.maxUtilizationPercent != null
                    ? Math.min(100, Math.round(row.maxUtilizationPercent))
                    : null
                return pct != null ? (
                  <div style={{ minWidth: 110 }}>
                    <Progress
                      percent={pct}
                      size="small"
                      strokeColor={
                        pct >= 95 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981'
                      }
                    />
                  </div>
                ) : (
                  formatPercentOrUnknown(row.maxUtilizationPercent, t.unknown)
                )
              },
            },
            {
              title: 'Lý do chặn / cảnh báo',
              render: (_, row) => {
                const reasons = [...row.blockingReasons, ...row.warningReasons].map(reasonVi)
                return reasons.length > 0 ? (
                  <Typography.Text
                    type={row.blocked ? 'danger' : 'warning'}
                    style={{ fontSize: 12 }}
                  >
                    {reasons.join(', ')}
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                )
              },
            },
          ]}
        />
      </Card>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, DatePicker, Input, Progress, Segmented, Space, Table, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
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
import { resourceLifecycleApi } from '../api'
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

type DateFilterMode = 'date' | 'month' | 'year'

function toHours(seconds: number | null | undefined): number {
  if (!seconds || seconds <= 0) return 0
  return Math.round((seconds / 3600) * 100) / 100
}

function resolveQueryDate(mode: DateFilterMode, selected: Dayjs): string {
  const today = dayjs()
  if (mode === 'date') return selected.format('YYYY-MM-DD')
  if (mode === 'month') {
    if (selected.isSame(today, 'month')) return today.format('YYYY-MM-DD')
    return selected.endOf('month').format('YYYY-MM-DD')
  }
  if (selected.isSame(today, 'year')) return today.format('YYYY-MM-DD')
  return selected.endOf('year').format('YYYY-MM-DD')
}

export function StaffWorkloadTab({ staff, loading }: StaffWorkloadTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<DateFilterMode>('date')
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs())
  const [customStaff, setCustomStaff] = useState<StaffWorkloadResponse[] | null>(null)
  const [fetchingDate, setFetchingDate] = useState(false)

  const todayStr = dayjs().format('YYYY-MM-DD')
  const queryDate = resolveQueryDate(filterMode, selectedDate)
  const isDefaultToday = queryDate === todayStr

  useEffect(() => {
    if (isDefaultToday) {
      setCustomStaff(null)
      setFetchingDate(false)
      return
    }
    const controller = new AbortController()
    setFetchingDate(true)
    resourceLifecycleApi
      .listStaff(controller.signal, queryDate)
      .then((res) => {
        if (!controller.signal.aborted) setCustomStaff(res)
      })
      .catch(() => {
        // Keep previous data on transient error or abort
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetchingDate(false)
      })
    return () => controller.abort()
  }, [isDefaultToday, queryDate])

  const activeStaff = customStaff ?? staff
  const tableLoading = loading || fetchingDate

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return activeStaff
    return activeStaff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }, [activeStaff, search])

  const periodLabel =
    filterMode === 'date'
      ? selectedDate.format('DD/MM/YYYY')
      : filterMode === 'month'
        ? `tháng ${selectedDate.format('MM/YYYY')}`
        : `năm ${selectedDate.format('YYYY')}`

  const chartData = useMemo(
    () =>
      activeStaff.slice(0, 10).map((s) => ({
        name: s.fullName.length > 15 ? `${s.fullName.slice(0, 14)}…` : s.fullName,
        actual:
          filterMode === 'date'
            ? toHours(s.dailyActualSeconds)
            : filterMode === 'month'
              ? toHours(s.monthlyActualSeconds)
              : toHours(s.yearlyActualSeconds ?? s.monthlyActualSeconds),
        estimated:
          filterMode === 'date'
            ? toHours(s.dailyEstimatedSeconds)
            : filterMode === 'month'
              ? toHours(s.monthlyEstimatedSeconds)
              : toHours(s.yearlyEstimatedSeconds ?? s.monthlyEstimatedSeconds),
      })),
    [activeStaff, filterMode],
  )

  const handleResetToday = () => {
    setFilterMode('date')
    setSelectedDate(dayjs())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card
        className="rl-chart-card"
        title={`Giờ làm việc ${filterMode === 'date' ? `ngày ${periodLabel}` : periodLabel} theo nhân sự (giờ)`}
        extra={
          <Space wrap size={[8, 8]}>
            <Segmented<DateFilterMode>
              size="small"
              value={filterMode}
              onChange={(val) => setFilterMode(val)}
              options={[
                { label: 'Ngày', value: 'date' },
                { label: 'Tháng', value: 'month' },
                { label: 'Năm', value: 'year' },
              ]}
            />
            <DatePicker
              size="small"
              picker={filterMode}
              allowClear={false}
              value={selectedDate}
              onChange={(val) => val && setSelectedDate(val)}
              format={
                filterMode === 'date'
                  ? 'DD/MM/YYYY'
                  : filterMode === 'month'
                    ? 'MM/YYYY'
                    : 'YYYY'
              }
            />
            {!isDefaultToday || filterMode !== 'date' ? (
              <Button size="small" onClick={handleResetToday}>
                Hôm nay
              </Button>
            ) : null}
          </Space>
        }
      >
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
                  name === 'actual' ? `Thực tế (${periodLabel})` : `Ước tính (${periodLabel})`,
                ]}
              />
              <Legend
                formatter={(v) =>
                  v === 'actual' ? `Thực tế (${periodLabel})` : `Ước tính (${periodLabel})`
                }
              />
              <Bar dataKey="actual" stackId="w" fill="#7c3aed" radius={[0, 0, 0, 0]} maxBarSize={30} />
              <Bar dataKey="estimated" stackId="w" fill="#c4b5fd" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        className="rl-chart-card"
        title={`Chi tiết khối lượng nhân sự (${filteredStaff.length})`}
        extra={
          <Tag color="blue" style={{ margin: 0 }}>
            Đang xem: {filterMode === 'date' ? `Ngày ${periodLabel}` : periodLabel}
          </Tag>
        }
      >
        <div className="rl-toolbar">
          <Input.Search
            allowClear
            placeholder="Tìm theo tên hoặc email nhân sự…"
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Space wrap size={[8, 8]}>
            <Segmented<DateFilterMode>
              value={filterMode}
              onChange={(val) => setFilterMode(val)}
              options={[
                { label: 'Ngày', value: 'date' },
                { label: 'Tháng', value: 'month' },
                { label: 'Năm', value: 'year' },
              ]}
            />
            <DatePicker
              picker={filterMode}
              allowClear={false}
              value={selectedDate}
              onChange={(val) => val && setSelectedDate(val)}
              format={
                filterMode === 'date'
                  ? 'DD/MM/YYYY'
                  : filterMode === 'month'
                    ? 'MM/YYYY'
                    : 'YYYY'
              }
            />
            {!isDefaultToday || filterMode !== 'date' ? (
              <Button onClick={handleResetToday}>Hôm nay</Button>
            ) : null}
          </Space>
        </div>
        <Table<StaffWorkloadResponse>
          rowKey="staffId"
          loading={tableLoading}
          dataSource={filteredStaff}
          scroll={{ x: 1120 }}
          pagination={{ pageSize: 10, locale: { items_per_page: '/ trang' } }}
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
              title: isDefaultToday
                ? 'Hôm nay (Thực tế / Ước tính)'
                : `Ngày ${selectedDate.format('DD/MM/YYYY')} (Thực tế / Ước tính)`,
              render: (_, row) =>
                `${formatHoursOrUnknown(row.dailyActualSeconds)} / ${formatHoursOrUnknown(row.dailyEstimatedSeconds)}`,
            },
            {
              title: 'Tuần (Thực tế / Ước tính)',
              render: (_, row) =>
                `${formatHoursOrUnknown(row.weeklyActualSeconds)} / ${formatHoursOrUnknown(row.weeklyEstimatedSeconds)}`,
            },
            {
              title: `Tháng ${selectedDate.format('MM/YYYY')} (Thực tế / Ước tính)`,
              render: (_, row) =>
                `${formatHoursOrUnknown(row.monthlyActualSeconds)} / ${formatHoursOrUnknown(row.monthlyEstimatedSeconds)}`,
            },
            {
              title: `Năm ${selectedDate.format('YYYY')} (Thực tế / Ước tính)`,
              render: (_, row) =>
                row.yearlyActualSeconds !== undefined
                  ? `${formatHoursOrUnknown(row.yearlyActualSeconds)} / ${formatHoursOrUnknown(row.yearlyEstimatedSeconds)}`
                  : '—',
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
                      format={(p) => `${p ?? 0}%`}
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

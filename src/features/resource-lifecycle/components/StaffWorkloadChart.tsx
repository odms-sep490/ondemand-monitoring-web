import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Descriptions, Input, Segmented, Select, Spin, Tag, Tooltip as AntTooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { reasonVi } from '../formatters'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { resourceLifecycleApi } from '../api'
import type { PolicyResponse, StaffWorkloadResponse } from '../types'

type Period = 'DAY' | 'WEEK' | 'MONTH'

const TODAY_PERIODS: { label: string; value: Period }[] = [
  { label: 'Hôm nay', value: 'DAY' },
  { label: 'Tuần này', value: 'WEEK' },
  { label: 'Tháng này', value: 'MONTH' },
]

const CUSTOM_DATE_PERIODS: { label: string; value: Period }[] = [
  { label: 'Theo ngày', value: 'DAY' },
  { label: 'Theo tuần', value: 'WEEK' },
  { label: 'Theo tháng', value: 'MONTH' },
]

/** Monday–Sunday bounds matching backend ISO week calculation. */
function getWeekBounds(date: Dayjs): { start: Dayjs; end: Dayjs } {
  const day = date.day()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = date.add(diffToMonday, 'day')
  return { start, end: start.add(6, 'day') }
}

function formatWeekRange(date: Dayjs): string {
  const { start, end } = getWeekBounds(date)
  if (start.year() === end.year()) {
    return `${start.format('DD/MM')} – ${end.format('DD/MM/YYYY')}`
  }
  return `${start.format('DD/MM/YYYY')} – ${end.format('DD/MM/YYYY')}`
}

const COLORS = {
  ok: '#10b981',
  warn: '#f59e0b',
  over: '#ef4444',
  none: '#2563eb',
}

function num(value: unknown): number | null {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Limit in hours for a period; month falls back to 4.33 weeks when only a weekly limit exists. */
export function periodLimitHours(
  rules: Record<string, unknown> | undefined,
  period: Period,
): number | null {
  if (!rules) return null
  const fromSeconds = (key: string) => {
    const s = num(rules[key])
    return s == null ? null : s / 3600
  }
  if (period === 'DAY')
    return num(rules.maxDailyHours) ?? fromSeconds('maxDailySeconds')
  const weekly = num(rules.maxWeeklyHours) ?? fromSeconds('maxWeeklySeconds')
  if (period === 'WEEK') return weekly
  return (
    num(rules.maxMonthlyHours) ??
    fromSeconds('maxMonthlySeconds') ??
    (weekly != null ? Math.round(weekly * 4.33) : null)
  )
}

function periodSeconds(s: StaffWorkloadResponse, period: Period): number {
  if (period === 'DAY')
    return (s.dailyActualSeconds ?? 0) + (s.dailyEstimatedSeconds ?? 0)
  if (period === 'WEEK')
    return (s.weeklyActualSeconds ?? 0) + (s.weeklyEstimatedSeconds ?? 0)
  return (s.monthlyActualSeconds ?? 0) + (s.monthlyEstimatedSeconds ?? 0)
}

const round1 = (n: number) => Math.round(n * 10) / 10

type StaffRow = {
  id: string
  name: string
  fullName: string
  hours: number
  limit: number | null
  percent: number | null
  warningPercent: number
  color: string
  value: number
  shortLabel: string
  detailLabel: string
  level: Level
  source: StaffWorkloadResponse
  rules: Record<string, unknown> | undefined
}

type Level = 'OK' | 'WARN' | 'OVER' | 'NONE'
type SortKey = 'LOAD_DESC' | 'LOAD_ASC' | 'NAME'

const LEVEL_OPTIONS: { label: string; value: Level | 'ALL' }[] = [
  { label: 'Tất cả mức tải', value: 'ALL' },
  { label: 'Bình thường', value: 'OK' },
  { label: 'Cảnh báo', value: 'WARN' },
  { label: 'Quá giới hạn', value: 'OVER' },
]

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Tải cao → thấp', value: 'LOAD_DESC' },
  { label: 'Tải thấp → cao', value: 'LOAD_ASC' },
  { label: 'Tên A → Z', value: 'NAME' },
]

/** One row of the detail panel: hours used vs the limit for a period. */
function usageText(seconds: number, limit: number | null) {
  const h = round1(seconds / 3600)
  if (!limit) return `${h} giờ`
  return `${h} / ${limit} giờ (${Math.round((h / limit) * 100)}%)`
}

function StaffTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: StaffRow }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const r = payload[0].payload
  return (
    <div className="rl-tooltip">
      <div className="rl-tooltip-title">{r.fullName}</div>
      <div className="rl-tooltip-row">
        <span>Giờ làm việc</span>
        <strong>
          {r.limit ? `${r.hours} / ${r.limit} giờ` : `${r.hours} giờ`}
        </strong>
      </div>
      {r.percent != null && (
        <div className="rl-tooltip-row">
          <span>Mức sử dụng</span>
          <strong style={{ color: r.color }}>{r.percent}%</strong>
        </div>
      )}
    </div>
  )
}

/** Staff workload per day/week/month, measured against the active workforce policy limit for that period. */
export function StaffWorkloadChart({
  staff,
}: {
  staff: StaffWorkloadResponse[]
}) {
  const [period, setPeriod] = useState<Period>('WEEK')
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs())
  const [customStaff, setCustomStaff] = useState<StaffWorkloadResponse[] | null>(null)
  const [fetchingDate, setFetchingDate] = useState(false)
  const [policies, setPolicies] = useState<PolicyResponse[]>([])
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<Level | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('LOAD_DESC')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')
  const queryDate =
    period === 'MONTH'
      ? selectedDate.isSame(today, 'month')
        ? todayStr
        : selectedDate.endOf('month').format('YYYY-MM-DD')
      : selectedDate.format('YYYY-MM-DD')
  const isToday = selectedDate.isSame(today, 'day')
  const isDefaultToday = queryDate === todayStr

  useEffect(() => {
    const controller = new AbortController()
    resourceLifecycleApi
      .listPolicies('WORKFORCE', controller.signal)
      .then((rows) => setPolicies(rows ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setPolicies([])
      })
    return () => controller.abort()
  }, [])

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
        if (!controller.signal.aborted) setCustomStaff(res ?? [])
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

  const rows: StaffRow[] = useMemo(() => {
    const byId = new Map(policies.map((p) => [p.id, p]))
    const fallback = policies.find((p) => p.active)
    return activeStaff.map((s) => {
      const policy =
        (s.activePolicyId ? byId.get(s.activePolicyId) : undefined) ?? fallback
      const warningPercent = num(policy?.rules?.warningPercent) ?? 80
      const limit = periodLimitHours(policy?.rules, period)
      const hours = round1(periodSeconds(s, period) / 3600)
      const percent = limit ? Math.round((hours / limit) * 100) : null
      const color =
        percent == null
          ? COLORS.none
          : percent >= 100
            ? COLORS.over
            : percent >= warningPercent
              ? COLORS.warn
              : COLORS.ok
      return {
        id: s.staffId,
        name:
          s.fullName.length > 18 ? `${s.fullName.slice(0, 17)}…` : s.fullName,
        fullName: s.fullName,
        hours,
        limit,
        percent,
        warningPercent,
        color,
        value: percent ?? hours,
        shortLabel: percent != null ? `${percent}%` : `${hours}h`,
        detailLabel: limit
          ? `${hours}/${limit} giờ · ${percent}%`
          : `${hours} giờ`,
        level: (percent == null
          ? 'NONE'
          : percent >= 100
            ? 'OVER'
            : percent >= warningPercent
              ? 'WARN'
              : 'OK') as Level,
        source: s,
        rules: policy?.rules,
      }
    })
  }, [activeStaff, policies, period])

  // Filtered + sorted view the chart, pills and detail panel all read from.
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = rows.filter(
      (r) =>
        (levelFilter === 'ALL' || r.level === levelFilter) &&
        (!q || r.fullName.toLowerCase().includes(q) || r.source.email?.toLowerCase().includes(q)),
    )
    return [...filtered].sort((a, b) =>
      sortKey === 'NAME'
        ? a.fullName.localeCompare(b.fullName, 'vi')
        : sortKey === 'LOAD_ASC'
          ? a.value - b.value
          : b.value - a.value,
    )
  }, [rows, search, levelFilter, sortKey])

  const selected = rows.find((r) => r.id === selectedId) ?? null

  const hasLimit = rows.some((r) => r.limit != null)
  const warningPercent =
    rows.find((r) => r.limit != null)?.warningPercent ?? 80
  const maxValue = Math.max(hasLimit ? 110 : 1, ...rows.map((r) => r.value))
  const domainMax = hasLimit
    ? Math.ceil((maxValue + 12) / 25) * 25
    : Math.ceil(maxValue * 1.25)
  const overCount = rows.filter((r) => (r.percent ?? 0) >= 100).length
  const warnCount = rows.filter(
    (r) =>
      r.percent != null && r.percent >= r.warningPercent && r.percent < 100,
  ).length
  const isSameWeek =
    getWeekBounds(selectedDate).start.isSame(getWeekBounds(today).start, 'day')
  const isSameMonth = selectedDate.isSame(today, 'month')
  const weekRangeText = formatWeekRange(selectedDate)
  const dayText = selectedDate.format('DD/MM/YYYY')
  const monthText = selectedDate.format('MM/YYYY')

  const periodLabel =
    period === 'DAY'
      ? isToday
        ? `hôm nay (${dayText})`
        : `ngày ${dayText}`
      : period === 'WEEK'
        ? isSameWeek
          ? `tuần này (${weekRangeText})`
          : `tuần ${weekRangeText}`
        : isSameMonth
          ? `tháng này (${monthText})`
          : `tháng ${monthText}`

  const stepUnit = period === 'DAY' ? 'day' : period === 'WEEK' ? 'week' : 'month'
  const stepUnitVi = period === 'DAY' ? 'ngày' : period === 'WEEK' ? 'tuần' : 'tháng'
  const handleStep = (delta: -1 | 1) =>
    setSelectedDate((cur) => cur.add(delta, stepUnit))

  return (
    <Card
      className="rl-chart-card"
      title={
        hasLimit
          ? `Mức tải công việc nhân sự ${periodLabel}`
          : `Giờ làm việc nhân sự ${periodLabel}`
      }
      extra={
        <div className="rl-period-controls">
          <Segmented<Period>
            size="small"
            className="rl-period-segmented"
            options={isToday ? TODAY_PERIODS : CUSTOM_DATE_PERIODS}
            value={period}
            onChange={setPeriod}
          />
          <div className="rl-date-stepper">
            <AntTooltip title={`Lùi 1 ${stepUnitVi}`}>
              <Button
                size="small"
                type="text"
                className="rl-date-step-btn"
                icon={<LeftOutlined />}
                aria-label={`Lùi 1 ${stepUnitVi}`}
                onClick={() => handleStep(-1)}
              />
            </AntTooltip>
            <DatePicker
              size="small"
              variant="borderless"
              className="rl-date-step-picker"
              picker={period === 'MONTH' ? 'month' : 'date'}
              allowClear={false}
              value={selectedDate}
              onChange={(val) => val && setSelectedDate(val)}
              format={period === 'MONTH' ? 'MM/YYYY' : 'DD/MM/YYYY'}
              style={{ width: period === 'MONTH' ? 98 : 116 }}
            />
            <AntTooltip title={`Tiến 1 ${stepUnitVi}`}>
              <Button
                size="small"
                type="text"
                className="rl-date-step-btn"
                icon={<RightOutlined />}
                aria-label={`Tiến 1 ${stepUnitVi}`}
                onClick={() => handleStep(1)}
              />
            </AntTooltip>
          </div>
          {!isToday && (
            <Button
              size="small"
              className="rl-date-today-btn"
              onClick={() => setSelectedDate(dayjs())}
            >
              Hôm nay
            </Button>
          )}
        </div>
      }
    >
      <Spin spinning={fetchingDate}>
      {rows.length === 0 ? (
        <div className="rl-empty-chart">
          <strong>Chưa có dữ liệu tải công việc nhân sự</strong>
          <span>Giờ làm của phi công và kỹ thuật viên sẽ hiển thị tại đây.</span>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
              fontSize: 12,
            }}
          >
            {hasLimit ? (
              <>
                <span
                  className="rl-pill-stat"
                  style={{ background: '#ecfdf5', color: '#047857' }}
                >
                  Bình thường &lt; {warningPercent}%
                </span>
                <span
                  className="rl-pill-stat"
                  style={{ background: '#fef3c7', color: '#b45309' }}
                >
                  Cảnh báo ≥ {warningPercent}% · {warnCount}
                </span>
                <span
                  className="rl-pill-stat"
                  style={{ background: '#fee2e2', color: '#b91c1c' }}
                >
                  Quá giới hạn ≥ 100% · {overCount}
                </span>
              </>
            ) : (
              <span style={{ color: '#64748b' }}>
                Chưa có chính sách giới hạn giờ làm, đang hiển thị số giờ.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <Input.Search
              allowClear
              placeholder="Tìm nhân sự theo tên hoặc email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 220px', maxWidth: 320 }}
            />
            <Select
              value={levelFilter}
              onChange={setLevelFilter}
              options={LEVEL_OPTIONS}
              style={{ minWidth: 160 }}
            />
            <Select value={sortKey} onChange={setSortKey} options={SORT_OPTIONS} style={{ minWidth: 150 }} />
            <span style={{ alignSelf: 'center', fontSize: 12, color: '#64748b' }}>
              {visibleRows.length}/{rows.length} nhân sự · bấm vào cột để xem chi tiết
            </span>
          </div>

          {visibleRows.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Không có nhân sự khớp bộ lọc</strong>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart
              data={visibleRows}
              margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, domainMax]}
                unit={hasLimit ? '%' : 'h'}
                tick={{ fontSize: 11.5, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                content={<StaffTooltip />}
              />
              {hasLimit && (
                <ReferenceArea
                  y1={100}
                  y2={domainMax}
                  fill="#ef4444"
                  fillOpacity={0.07}
                />
              )}
              {hasLimit && (
                <ReferenceLine
                  y={warningPercent}
                  stroke={COLORS.warn}
                  strokeDasharray="4 4"
                  label={{
                    value: `Cảnh báo ${warningPercent}%`,
                    position: 'insideTopRight',
                    fill: '#b45309',
                    fontSize: 11,
                  }}
                />
              )}
              {hasLimit && (
                <ReferenceLine
                  y={100}
                  stroke={COLORS.over}
                  strokeWidth={1.5}
                  label={{
                    value: 'Giới hạn 100%',
                    position: 'insideTopRight',
                    fill: '#b91c1c',
                    fontSize: 11,
                  }}
                />
              )}
              <Bar
                dataKey="value"
                radius={[8, 8, 2, 2]}
                maxBarSize={48}
                cursor="pointer"
                onClick={(data: { payload?: StaffRow }) =>
                  data?.payload && setSelectedId((cur) => (cur === data.payload!.id ? null : data.payload!.id))
                }
              >
                {visibleRows.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    fillOpacity={selectedId && selectedId !== entry.id ? 0.35 : 1}
                  />
                ))}
                <LabelList
                  dataKey="shortLabel"
                  position="top"
                  style={{ fontSize: 12, fontWeight: 700, fill: '#0f172a' }}
                />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
          )}

          <div className="rl-staff-pills">
            {visibleRows.map((r) => (
              <div
                key={r.id}
                className="rl-staff-pill"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId((cur) => (cur === r.id ? null : r.id))}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId((cur) => (cur === r.id ? null : r.id))}
                style={{
                  cursor: 'pointer',
                  outline: selectedId === r.id ? `2px solid ${r.color}` : undefined,
                }}
              >
                <span className="rl-staff-pill-name" title={r.fullName}>
                  <span
                    className="rl-status-dot"
                    style={{ background: r.color }}
                  />
                  {r.fullName}
                </span>
                <span className="rl-staff-pill-val" style={{ color: r.color }}>
                  {r.detailLabel}
                </span>
              </div>
            ))}
          </div>

          {selected && (
            <Card
              size="small"
              style={{ marginTop: 12, borderColor: selected.color }}
              title={
                <span>
                  Chi tiết: {selected.fullName}{' '}
                  <Tag color={selected.level === 'OVER' ? 'red' : selected.level === 'WARN' ? 'orange' : selected.level === 'OK' ? 'green' : 'blue'}>
                    {selected.level === 'OVER' ? 'Quá giới hạn' : selected.level === 'WARN' ? 'Cảnh báo' : selected.level === 'OK' ? 'Bình thường' : 'Chưa có giới hạn'}
                  </Tag>
                </span>
              }
              extra={<a onClick={() => setSelectedId(null)}>Đóng</a>}
            >
              <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                <Descriptions.Item label={isToday ? 'Hôm nay' : `Ngày ${dayText}`}>
                  {usageText(
                    (selected.source.dailyActualSeconds ?? 0) + (selected.source.dailyEstimatedSeconds ?? 0),
                    periodLimitHours(selected.rules, 'DAY'),
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={isSameWeek ? 'Tuần này' : `Tuần (${weekRangeText})`}>
                  {usageText(
                    (selected.source.weeklyActualSeconds ?? 0) + (selected.source.weeklyEstimatedSeconds ?? 0),
                    periodLimitHours(selected.rules, 'WEEK'),
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={isSameMonth ? 'Tháng này' : `Tháng ${monthText}`}>
                  {usageText(
                    (selected.source.monthlyActualSeconds ?? 0) + (selected.source.monthlyEstimatedSeconds ?? 0),
                    periodLimitHours(selected.rules, 'MONTH'),
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Đã làm thực tế (tuần)">
                  {round1((selected.source.weeklyActualSeconds ?? 0) / 3600)} giờ
                </Descriptions.Item>
                <Descriptions.Item label="Dự kiến theo lịch (tuần)">
                  {round1((selected.source.weeklyEstimatedSeconds ?? 0) / 3600)} giờ
                </Descriptions.Item>
                <Descriptions.Item label="Nghỉ trước ca kế tiếp">
                  {selected.source.restSecondsBeforeNextMission == null
                    ? 'Chưa có ca kế tiếp'
                    : `${round1(selected.source.restSecondsBeforeNextMission / 3600)} giờ`}
                </Descriptions.Item>
                <Descriptions.Item label="Chính sách áp dụng" span={3}>
                  {selected.source.activePolicyName ?? 'Chưa có'}
                </Descriptions.Item>
                <Descriptions.Item label="Lý do cảnh báo / chặn" span={3}>
                  {[...selected.source.blockingReasons, ...selected.source.warningReasons].length === 0
                    ? 'Không có'
                    : [...selected.source.blockingReasons, ...selected.source.warningReasons].map((reason) => (
                        <Tag
                          key={reason}
                          color={selected.source.blockingReasons.includes(reason) ? 'red' : 'orange'}
                        >
                          {reasonVi(reason)}
                        </Tag>
                      ))}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </>
      )}
      </Spin>
    </Card>
  )
}

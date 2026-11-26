import { useMemo } from 'react'
import { Alert, Button, Card, Space, Table, Tag, message } from 'antd'
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
  alertSeverityVi,
  alertStatusVi,
  alertTypeVi,
  formatDateTimeOrUnknown,
  formatHoursOrUnknown,
  statusTagColor,
} from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type { AlertResponse, ScheduleForecastItem } from '../types'

interface AlertsAndForecastTabProps {
  alerts: AlertResponse[]
  forecasts: ScheduleForecastItem[]
  loading: boolean
  onRefresh: () => void
}

function toHours(seconds: number | null | undefined): number {
  if (!seconds || seconds <= 0) return 0
  return Math.round((seconds / 3600) * 100) / 100
}

export function AlertsAndForecastTab({
  alerts,
  forecasts,
  loading,
  onRefresh,
}: AlertsAndForecastTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)

  const forecastChartData = useMemo(
    () =>
      forecasts.slice(0, 10).map((f) => ({
        name: f.deviceName.length > 14 ? `${f.deviceName.slice(0, 13)}…` : f.deviceName,
        usedHours: toHours(f.currentSinceMaintenanceSeconds),
        scheduledHours: toHours(f.scheduledProjectedSeconds),
      })),
    [forecasts],
  )

  const handleAction = async (id: string, action: 'ACKNOWLEDGE' | 'RESOLVE') => {
    try {
      await resourceLifecycleApi.actOnAlert(id, {
        action,
        reason:
          action === 'ACKNOWLEDGE'
            ? 'Quản trị/Quản lý đã tiếp nhận cảnh báo'
            : 'Đã xử lý ghi nhận cảnh báo (không tự gỡ điều kiện chặn)',
      })
      message.success('Đã cập nhật trạng thái cảnh báo.')
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card
        className="rl-chart-card"
        title="Biểu đồ dự báo giờ bay theo lịch sắp tới (giờ)"
      >
        {forecastChartData.length === 0 ? (
          <div className="rl-empty-chart">
            <strong>Chưa có lịch nhiệm vụ để dự báo</strong>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={forecastChartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11.5 }} />
              <YAxis tick={{ fontSize: 11.5 }} unit="h" />
              <Tooltip
                formatter={(v, name) => [
                  `${v ?? 0} giờ`,
                  name === 'usedHours'
                    ? 'Đã dùng từ bảo trì cuối'
                    : 'Dự kiến theo lịch sắp tới',
                ]}
              />
              <Legend
                formatter={(v) =>
                  v === 'usedHours'
                    ? 'Đã dùng từ bảo trì cuối'
                    : 'Dự kiến theo lịch sắp tới'
                }
              />
              <Bar dataKey="usedHours" stackId="f" fill="#2563eb" maxBarSize={28} />
              <Bar
                dataKey="scheduledHours"
                stackId="f"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        className="rl-chart-card"
        title={`Cảnh báo sức khỏe nguồn lực (${alerts.length})`}
      >
        <Table<AlertResponse>
          rowKey="id"
          loading={loading}
          size="small"
          dataSource={alerts}
          pagination={{ pageSize: 8, locale: { items_per_page: '/ trang' } }}
          columns={[
            {
              title: 'Loại',
              dataIndex: 'type',
              render: (v: string) => <Tag color="blue">{alertTypeVi(v)}</Tag>,
            },
            {
              title: 'Mức độ',
              dataIndex: 'severity',
              render: (sev: string) => (
                <Tag color={sev === 'HIGH' || sev === 'CRITICAL' ? 'red' : 'orange'}>
                  {alertSeverityVi(sev)}
                </Tag>
              ),
            },
            { title: 'Mô tả', dataIndex: 'description' },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (st: string) => (
                <Tag color={statusTagColor(st)}>{alertStatusVi(st)}</Tag>
              ),
            },
            {
              title: 'Phát hiện lúc',
              render: (_, r) => formatDateTimeOrUnknown(r.detectedAt, t.unknown),
            },
            {
              title: 'Thao tác',
              render: (_, r) =>
                r.status === 'RESOLVED' ? null : (
                  <Space>
                    {r.status === 'OPEN' && (
                      <Button
                        size="small"
                        onClick={() => void handleAction(r.id, 'ACKNOWLEDGE')}
                      >
                        {t.actions.acknowledge}
                      </Button>
                    )}
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      onClick={() => void handleAction(r.id, 'RESOLVE')}
                    >
                      {t.actions.resolve}
                    </Button>
                  </Space>
                ),
            },
          ]}
        />
      </Card>

      <Card
        className="rl-chart-card"
        title="Chi tiết dự báo bảo trì theo lịch nhiệm vụ"
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 14 }}
          message={t.forecastDisclaimer}
        />
        <Table<ScheduleForecastItem>
          rowKey="deviceId"
          loading={loading}
          size="small"
          dataSource={forecasts}
          pagination={{ pageSize: 8, locale: { items_per_page: '/ trang' } }}
          columns={[
            { title: 'Drone', dataIndex: 'deviceName', render: (v: string) => <strong>{v}</strong> },
            {
              title: 'Đã dùng từ lần bảo trì cuối',
              render: (_, f) =>
                formatHoursOrUnknown(f.currentSinceMaintenanceSeconds, t.unknown),
            },
            {
              title: 'Dự kiến theo lịch sắp tới',
              render: (_, f) =>
                formatHoursOrUnknown(f.scheduledProjectedSeconds, t.unknown),
            },
            {
              title: 'Dự kiến còn lại sau lịch',
              render: (_, f) =>
                formatHoursOrUnknown(f.remainingSecondsAfterSchedule, t.unknown),
            },
            {
              title: 'Nguy cơ chạm ngưỡng',
              render: (_, f) => (
                <Tag color={f.projectedBreach ? 'red' : 'green'}>
                  {f.projectedBreach ? 'Có nguy cơ vượt ngưỡng' : 'Trong giới hạn'}
                </Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

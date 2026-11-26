import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
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
import { resourceLifecycleApi } from '../api'
import {
  formatDateTimeOrUnknown,
  formatHoursOrUnknown,
  formatPercentOrUnknown,
  operationalStatusVi,
  statusTagColor,
} from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type {
  DroneHealthResponse,
  MaintenanceCycleResponse,
  UsageResponse,
} from '../types'

interface DroneLifecycleTabProps {
  drones: DroneHealthResponse[]
  pendingUsage: UsageResponse[]
  cycles: MaintenanceCycleResponse[]
  loading: boolean
  onRefresh: () => void
}

export function DroneLifecycleTab({
  drones,
  pendingUsage,
  cycles,
  loading,
  onRefresh,
}: DroneLifecycleTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [usageTarget, setUsageTarget] = useState<DroneHealthResponse | null>(null)
  const [workTarget, setWorkTarget] = useState<MaintenanceCycleResponse | null>(null)
  const [inspectTarget, setInspectTarget] = useState<MaintenanceCycleResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [usageForm] = Form.useForm()
  const [workForm] = Form.useForm()
  const [inspectForm] = Form.useForm()

  const filteredDrones = useMemo(() => {
    const q = search.trim().toLowerCase()
    return drones.filter((d) => {
      const matchQuery =
        !q ||
        d.deviceName.toLowerCase().includes(q) ||
        d.serialNumber.toLowerCase().includes(q) ||
        (d.modelName ?? '').toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'HEALTHY' &&
          !d.blocked &&
          (d.maintenanceStatus === 'HEALTHY' || d.maintenanceStatus === 'UNKNOWN')) ||
        (statusFilter === 'WARNING' &&
          (d.maintenanceStatus === 'MAINTENANCE_DUE_SOON' ||
            d.maintenanceStatus === 'MONITOR')) ||
        (statusFilter === 'BLOCKED' && d.blocked)
      return matchQuery && matchStatus
    })
  }, [drones, search, statusFilter])

  const hoursChartData = useMemo(
    () =>
      drones.slice(0, 10).map((d) => ({
        name: d.deviceName.length > 14 ? `${d.deviceName.slice(0, 13)}…` : d.deviceName,
        actualHours:
          d.lifetimeActualSeconds != null
            ? Math.round((d.lifetimeActualSeconds / 3600) * 100) / 100
            : 0,
        estimatedHours: Math.round(((d.lifetimeEstimatedSeconds ?? 0) / 3600) * 100) / 100,
        sinceMaintenance:
          d.sinceMaintenanceSeconds != null
            ? Math.round((d.sinceMaintenanceSeconds / 3600) * 100) / 100
            : 0,
      })),
    [drones],
  )

  const opStatusData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const d of drones) {
      const key = d.operationalStatus || 'UNKNOWN'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const palette: Record<string, string> = {
      AVAILABLE: '#10b981',
      MAINTENANCE: '#ef4444',
      IN_MISSION: '#2563eb',
      ACTIVE_MISSION: '#2563eb',
      RESERVED: '#f59e0b',
      CHARGING: '#0ea5e9',
    }
    return Array.from(counts.entries()).map(([code, value]) => ({
      code,
      name: operationalStatusVi(code),
      value,
      color: palette[code] ?? '#64748b',
    }))
  }, [drones])

  const handleRecordUsage = async () => {
    if (!usageTarget) return
    try {
      const values = await usageForm.validateFields()
      setSubmitting(true)
      const seconds = Math.round(Number(values.seconds))
      const endedAt = new Date()
      const startedAt = new Date(endedAt.getTime() - Math.max(seconds, 60) * 1000)
      await resourceLifecycleApi.recordUsage({
        resourceId: usageTarget.deviceId,
        resourceKind: 'DEVICE',
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        seconds,
        cycles: values.cycles ?? 1,
        distanceM: values.distanceM ?? null,
        idempotencyKey: `ui-drone-${usageTarget.deviceId}-${Date.now()}`,
        reason: values.reason,
        evidenceReference: values.evidenceReference,
      })
      message.success('Đã ghi nhận bản ghi sử dụng (chờ xác nhận).')
      usageForm.resetFields()
      setUsageTarget(null)
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyUsage = async (record: UsageResponse, approved: boolean) => {
    try {
      await resourceLifecycleApi.verifyUsage(record.id, {
        approved,
        reason: approved ? 'Xác nhận khớp bằng chứng vận hành' : 'Từ chối bản ghi không hợp lệ',
      })
      message.success(approved ? 'Đã xác nhận bản ghi sử dụng.' : 'Đã từ chối bản ghi.')
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  const handleSubmitWork = async () => {
    if (!workTarget) return
    try {
      const values = await workForm.validateFields()
      setSubmitting(true)
      await resourceLifecycleApi.submitMaintenanceWork(workTarget.id, {
        workNotes: values.workNotes,
        evidenceReference: values.evidenceReference,
        checklistItems: values.checklist
          ? String(values.checklist)
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        replacedComponents: values.components
          ? String(values.components)
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      })
      message.success('Đã nộp báo cáo công việc bảo trì (chờ kiểm tra sau bảo trì).')
      workForm.resetFields()
      setWorkTarget(null)
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInspect = async (passed: boolean) => {
    if (!inspectTarget) return
    try {
      const values = await inspectForm.validateFields()
      setSubmitting(true)
      await resourceLifecycleApi.inspectMaintenanceCycle(inspectTarget.id, {
        passed,
        reason: values.reason,
      })
      message.success(
        passed
          ? 'Kiểm tra đạt: đã tạo checkpoint và mở khóa drone nếu không còn điều kiện chặn.'
          : 'Kiểm tra chưa đạt: drone tiếp tục ở trạng thái bảo trì.',
      )
      inspectForm.resetFields()
      setInspectTarget(null)
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="rl-charts-grid">
        <Card className="rl-chart-card" title="Trạng thái vận hành đội Drone">
          {opStatusData.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có thiết bị</strong>
            </div>
          ) : (
            <div className="rl-donut-wrap">
              <div className="rl-donut-box">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={opStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {opStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v ?? 0} drone`, 'Số lượng']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="rl-donut-center">
                  <strong>{drones.length}</strong>
                  <span>thiết bị</span>
                </div>
              </div>
              <ul className="rl-legend-list">
                {opStatusData.map((entry) => (
                  <li key={entry.name} className="rl-legend-item">
                    <span className="rl-legend-dot" style={{ background: entry.color }} />
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="rl-chart-card" title="So sánh giờ bay thực tế & ước tính (giờ)">
          {hoursChartData.length === 0 ? (
            <div className="rl-empty-chart">
              <strong>Chưa có dữ liệu giờ hoạt động</strong>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hoursChartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  formatter={(v, name) => [
                    `${v ?? 0} giờ`,
                    name === 'actualHours'
                      ? 'Thực tế (Lifetime)'
                      : name === 'estimatedHours'
                        ? 'Ước tính'
                        : 'Từ bảo trì cuối',
                  ]}
                />
                <Legend
                  formatter={(v) =>
                    v === 'actualHours'
                      ? 'Thực tế'
                      : v === 'estimatedHours'
                        ? 'Ước tính'
                        : 'Từ bảo trì cuối'
                  }
                />
                <Bar dataKey="actualHours" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={22} />
                <Bar dataKey="estimatedHours" fill="#93c5fd" radius={[5, 5, 0, 0]} maxBarSize={22} />
                <Bar dataKey="sinceMaintenance" fill="#14b8a6" radius={[5, 5, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="rl-chart-card" title={`Danh sách chi tiết vòng đời Drone (${filteredDrones.length})`}>
        <div className="rl-toolbar">
          <Input.Search
            allowClear
            placeholder="Tìm tên drone, serial hoặc model…"
            style={{ maxWidth: 300 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Segmented
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { label: 'Tất cả', value: 'ALL' },
              { label: 'Ổn định', value: 'HEALTHY' },
              { label: 'Sắp bảo trì', value: 'WARNING' },
              { label: 'Đang khóa', value: 'BLOCKED' },
            ]}
          />
        </div>

        <Table<DroneHealthResponse>
          rowKey="deviceId"
          loading={loading}
          dataSource={filteredDrones}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Drone',
              key: 'device',
              render: (_, row) => (
                <div className="rl-entity-cell">
                  <span
                    className="rl-status-dot"
                    style={{
                      background:
                        row.operationalStatus === 'AVAILABLE'
                          ? '#10b981'
                          : row.operationalStatus === 'MAINTENANCE'
                            ? '#ef4444'
                            : '#2563eb',
                    }}
                  />
                  <div>
                    <strong>{row.deviceName}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {row.serialNumber} · {row.modelName ?? t.unknown}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Trạng thái bảo trì',
              key: 'maintenanceStatus',
              render: (_, row) => {
                const effectiveStatus =
                  row.maintenanceStatus === 'UNKNOWN' && !row.blocked
                    ? 'HEALTHY'
                    : row.blocked && row.maintenanceStatus === 'UNKNOWN'
                      ? 'MAINTENANCE_REQUIRED'
                      : row.maintenanceStatus
                return (
                  <Space direction="vertical" size={4}>
                    <Tag color={statusTagColor(effectiveStatus)}>
                      {t.statuses[effectiveStatus as keyof typeof t.statuses] ??
                        effectiveStatus}
                    </Tag>
                    <Tag
                      color={
                        row.operationalStatus === 'AVAILABLE'
                          ? 'green'
                          : row.operationalStatus === 'MAINTENANCE'
                            ? 'red'
                            : 'blue'
                      }
                      style={{ margin: 0 }}
                    >
                      {operationalStatusVi(row.operationalStatus)}
                    </Tag>
                  </Space>
                )
              },
            },
            {
              title: 'Giờ bay thực tế (tích lũy)',
              key: 'actual',
              render: (_, row) => (
                <strong>{formatHoursOrUnknown(row.lifetimeActualSeconds, t.unknown)}</strong>
              ),
            },
            {
              title: 'Giờ ước tính',
              key: 'estimated',
              render: (_, row) => formatHoursOrUnknown(row.lifetimeEstimatedSeconds, t.unknown),
            },
            {
              title: 'Từ lần bảo trì cuối',
              key: 'sinceMaintenance',
              render: (_, row) => {
                const pct =
                  row.utilizationPercent != null
                    ? Math.min(100, Math.round(row.utilizationPercent))
                    : null
                return (
                  <div style={{ minWidth: 150 }}>
                    <div>
                      <strong>{formatHoursOrUnknown(row.sinceMaintenanceSeconds, t.unknown)}</strong>
                    </div>
                    {pct != null && (
                      <Progress
                        percent={pct}
                        size="small"
                        strokeColor={pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'}
                        style={{ margin: '2px 0' }}
                      />
                    )}
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Còn lại: {formatHoursOrUnknown(row.remainingSeconds, t.unknown)} (
                      {formatPercentOrUnknown(row.utilizationPercent, t.unknown)})
                    </div>
                  </div>
                )
              },
            },
            {
              title: 'Nguồn dữ liệu',
              dataIndex: 'usageSource',
              render: (source: keyof typeof t.sources) => (
                <Tag color={source === 'TELEMETRY_ACTUAL' ? 'blue' : 'default'}>
                  {t.sources[source] ?? source}
                </Tag>
              ),
            },
            {
              title: 'Thao tác',
              key: 'actions',
              render: (_, row) => (
                <Button size="small" type="primary" ghost onClick={() => setUsageTarget(row)}>
                  {t.actions.recordUsage}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {pendingUsage.length > 0 && (
        <div>
          <Typography.Title level={5}>Bản ghi sử dụng chờ xác nhận ({pendingUsage.length})</Typography.Title>
          <Table<UsageResponse>
            rowKey="id"
            size="small"
            dataSource={pendingUsage}
            pagination={false}
            columns={[
              { title: 'Loại', dataIndex: 'resourceKind' },
              { title: 'Resource ID', dataIndex: 'resourceId' },
              {
                title: 'Thời lượng',
                render: (_, r) => `${formatHoursOrUnknown(r.actualSeconds)} (${r.actualSeconds}s)`,
              },
              { title: 'Bằng chứng', dataIndex: 'evidenceReference' },
              { title: 'Lý do', dataIndex: 'reason' },
              {
                title: 'Xác nhận',
                render: (_, r) => (
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => void handleVerifyUsage(r, true)}
                    >
                      {t.actions.approve}
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => void handleVerifyUsage(r, false)}
                    >
                      {t.actions.reject}
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </div>
      )}

      <div>
        <Typography.Title level={5}>Chu kỳ bảo trì & Checkpoint ({cycles.length})</Typography.Title>
        <Table<MaintenanceCycleResponse>
          rowKey="id"
          size="small"
          dataSource={cycles}
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: 'Drone / Chu kỳ',
              render: (_, c) => (
                <div>
                  <strong>{c.deviceName}</strong> · #{c.cycle}
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {c.policyName} · Ticket: {c.ticketCode ?? t.unknown} ({c.ticketStatus ?? '-'})
                  </div>
                </div>
              ),
            },
            {
              title: 'Phát hiện lúc',
              render: (_, c) => formatDateTimeOrUnknown(c.detectedAt, t.unknown),
            },
            {
              title: 'Checkpoint',
              render: (_, c) =>
                c.checkpointAt ? (
                  <Tag color="green">
                    Đã chốt ({formatHoursOrUnknown(c.checkpointSeconds)})
                  </Tag>
                ) : c.submittedAt ? (
                  <Tag color="orange">Chờ kiểm tra sau bảo trì</Tag>
                ) : (
                  <Tag color="red">Đang bảo trì</Tag>
                ),
            },
            {
              title: 'Thao tác',
              render: (_, c) =>
                c.checkpointAt ? null : (
                  <Space>
                    {!c.submittedAt && (
                      <Button size="small" onClick={() => setWorkTarget(c)}>
                        {t.actions.submitWork}
                      </Button>
                    )}
                    {c.submittedAt && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => setInspectTarget(c)}
                      >
                        {t.actions.inspect}
                      </Button>
                    )}
                  </Space>
                ),
            },
          ]}
        />
      </div>

      <Modal
        open={Boolean(usageTarget)}
        title={`Ghi nhận sử dụng — ${usageTarget?.deviceName ?? ''}`}
        onCancel={() => setUsageTarget(null)}
        onOk={() => void handleRecordUsage()}
        confirmLoading={submitting}
      >
        <Form form={usageForm} layout="vertical">
          <Form.Item
            name="seconds"
            label="Số giây sử dụng thực tế"
            rules={[{ required: true, message: 'Nhập số giây sử dụng' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Ví dụ: 10800 (3 giờ)" />
          </Form.Item>
          <Form.Item name="cycles" label="Số chu kỳ bay (cycles)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="1" />
          </Form.Item>
          <Form.Item name="distanceM" label="Quãng đường đo được (m, tùy chọn)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="evidenceReference"
            label="Nguồn bằng chứng (nhật ký bay / ảnh / biên bản)"
            rules={[{ required: true, message: 'Bắt buộc có nguồn bằng chứng' }]}
          >
            <Input placeholder="logbook://flight-2026-11-25" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do ghi nhận"
            rules={[{ required: true, message: 'Nhập lý do ghi nhận' }]}
          >
            <Input.TextArea rows={2} placeholder="Ghi nhận giờ bay thực tế sau nhiệm vụ..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(workTarget)}
        title={`Nộp công việc bảo trì — ${workTarget?.deviceName ?? ''}`}
        onCancel={() => setWorkTarget(null)}
        onOk={() => void handleSubmitWork()}
        confirmLoading={submitting}
      >
        <Form form={workForm} layout="vertical">
          <Form.Item
            name="workNotes"
            label="Nội dung công việc đã thực hiện"
            rules={[{ required: true, message: 'Nhập nội dung bảo trì' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="checklist" label="Checklist kiểm tra (mỗi dòng 1 mục)">
            <Input.TextArea rows={2} placeholder="Kiểm tra motor&#10;Cân bằng cánh quạt" />
          </Form.Item>
          <Form.Item name="components" label="Linh kiện thay thế (mỗi dòng 1 mục)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="evidenceReference"
            label="Bằng chứng hoàn thành"
            rules={[{ required: true, message: 'Bắt buộc có bằng chứng' }]}
          >
            <Input placeholder="maint://report-001" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(inspectTarget)}
        title={`Kiểm tra sau bảo trì — ${inspectTarget?.deviceName ?? ''}`}
        onCancel={() => setInspectTarget(null)}
        footer={[
          <Button key="cancel" onClick={() => setInspectTarget(null)}>
            Hủy
          </Button>,
          <Button
            key="fail"
            danger
            loading={submitting}
            onClick={() => void handleInspect(false)}
          >
            Chưa đạt
          </Button>,
          <Button
            key="pass"
            type="primary"
            loading={submitting}
            onClick={() => void handleInspect(true)}
          >
            Đạt & Tạo Checkpoint
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chỉ khi đạt kiểm tra sau bảo trì mới tạo checkpoint reset bộ đếm chu kỳ (giữ nguyên lifetime)."
        />
        <Form form={inspectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Nhận xét kiểm tra"
            rules={[{ required: true, message: 'Nhập nhận xét kiểm tra' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

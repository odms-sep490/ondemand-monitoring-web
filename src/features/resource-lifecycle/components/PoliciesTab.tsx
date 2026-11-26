import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import { resourceLifecycleApi } from '../api'
import {
  auditActorVi,
  formatDateTimeOrUnknown,
  reasonVi,
} from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type {
  DroneHealthResponse,
  PolicyFamily,
  PolicyImpactPreview,
  PolicyResponse,
  PolicyVersionResponse,
  StaffWorkloadResponse,
} from '../types'

interface PolicyPreset {
  key: string
  label: string
  summary: string
  values: Record<string, unknown>
}

const POLICY_PRESETS: Record<PolicyFamily, PolicyPreset[]> = {
  MAINTENANCE: [
    {
      key: 'standard',
      label: 'Tiêu chuẩn',
      summary: '50h · 100 chu kỳ · 90 ngày',
      values: {
        name: 'Bảo trì định kỳ tiêu chuẩn (50 giờ bay)',
        maxFlightHours: 50,
        maxFlightCycles: 100,
        maxCalendarDays: 90,
        monitorPercent: 60,
        warningPercent: 80,
        reason: 'Áp dụng chu kỳ bảo trì tiêu chuẩn theo khuyến nghị nhà sản xuất.',
      },
    },
    {
      key: 'strict',
      label: 'An toàn cao',
      summary: '30h · 60 chu kỳ · 60 ngày',
      values: {
        name: 'Bảo trì tăng cường an toàn (30 giờ bay)',
        maxFlightHours: 30,
        maxFlightCycles: 60,
        maxCalendarDays: 60,
        monitorPercent: 50,
        warningPercent: 75,
        reason: 'Tăng tần suất kiểm tra an toàn cho thiết bị hoạt động cường độ cao.',
      },
    },
    {
      key: 'extended',
      label: 'Định kỳ dài',
      summary: '100h · 200 chu kỳ · 180 ngày',
      values: {
        name: 'Bảo trì chu kỳ dài (100 giờ bay)',
        maxFlightHours: 100,
        maxFlightCycles: 200,
        maxCalendarDays: 180,
        monitorPercent: 70,
        warningPercent: 85,
        reason: 'Áp dụng chu kỳ bảo trì dài hạn cho dòng thiết bị ổn định.',
      },
    },
  ],
  WORKFORCE: [
    {
      key: 'standard',
      label: 'Hành chính chuẩn',
      summary: '8h/ngày · 40h/tuần · nghỉ 10h',
      values: {
        name: 'Chính sách giờ làm việc chuẩn (8h/ngày)',
        maxDailyHours: 8,
        maxWeeklyHours: 40,
        minRestHours: 10,
        reason: 'Đảm bảo giới hạn giờ làm việc chuẩn và thời gian nghỉ giữa ca cho nhân sự vận hành.',
      },
    },
    {
      key: 'peak',
      label: 'Cao điểm vận hành',
      summary: '10h/ngày · 48h/tuần · nghỉ 8h',
      values: {
        name: 'Chính sách giai đoạn cao điểm (10h/ngày)',
        maxDailyHours: 10,
        maxWeeklyHours: 48,
        minRestHours: 8,
        reason: 'Mở rộng hạn mức ca bay giai đoạn cao điểm, vẫn đảm bảo nghỉ tối thiểu 8 giờ.',
      },
    },
    {
      key: 'safe',
      label: 'An toàn cao / Bay đêm',
      summary: '6h/ngày · 32h/tuần · nghỉ 12h',
      values: {
        name: 'Chính sách giảm tải an toàn (6h/ngày)',
        maxDailyHours: 6,
        maxWeeklyHours: 32,
        minRestHours: 12,
        reason: 'Giảm tải công việc và tăng thời gian phục hồi cho nhân sự thực hiện nhiệm vụ đặc thù.',
      },
    },
  ],
  ALLOCATION: [
    {
      key: 'balanced',
      label: 'Cân bằng mặc định',
      summary: '40% / 30% / 15% / 15%',
      values: {
        name: 'Phân bổ AI cân bằng mặc định',
        healthMarginWeight: 0.4,
        workloadBalanceWeight: 0.3,
        restMarginWeight: 0.15,
        dataQualityWeight: 0.15,
        reason: 'Cân bằng giữa độ bền thiết bị, tải nhân sự và thời gian nghỉ.',
      },
    },
    {
      key: 'fleet',
      label: 'Ưu tiên thiết bị',
      summary: '55% / 20% / 15% / 10%',
      values: {
        name: 'Phân bổ AI ưu tiên biên bảo trì thiết bị',
        healthMarginWeight: 0.55,
        workloadBalanceWeight: 0.2,
        restMarginWeight: 0.15,
        dataQualityWeight: 0.1,
        reason: 'Ưu tiên chọn thiết bị còn nhiều biên bảo trì để giảm rủi ro hỏng hóc.',
      },
    },
    {
      key: 'workload',
      label: 'Ưu tiên cân bằng tải',
      summary: '25% / 45% / 20% / 10%',
      values: {
        name: 'Phân bổ AI ưu tiên cân bằng tải nhân sự',
        healthMarginWeight: 0.25,
        workloadBalanceWeight: 0.45,
        restMarginWeight: 0.2,
        dataQualityWeight: 0.1,
        reason: 'Phân chia đều khối lượng công việc và ưu tiên nhân sự có thời gian nghỉ tốt.',
      },
    },
  ],
}

const REASON_SUGGESTIONS: Record<PolicyFamily, string[]> = {
  MAINTENANCE: [
    'Theo khuyến nghị nhà sản xuất',
    'Chuẩn hóa quy trình bảo trì định kỳ',
    'Tăng cường an toàn cho đội bay',
    'Điều chỉnh theo thực tế khai thác',
  ],
  WORKFORCE: [
    'Chuẩn hóa định mức giờ làm việc',
    'Đảm bảo an toàn và thời gian nghỉ giữa ca',
    'Điều chỉnh nhân sự cho giai đoạn cao điểm',
    'Cập nhật quy định vận hành nội bộ',
  ],
  ALLOCATION: [
    'Tối ưu hiệu suất phân bổ tự động',
    'Cân bằng tải đội bay và nhân sự',
    'Cập nhật trọng số theo dữ liệu thực tế',
  ],
}

const RULE_LABELS: Record<
  string,
  { label: string; format: (val: unknown) => string; color?: string }
> = {
  maxDailyHours: {
    label: 'Giới hạn ngày',
    format: (v) => `Tối đa ${v} giờ/ngày`,
    color: 'blue',
  },
  maxWeeklyHours: {
    label: 'Giới hạn tuần',
    format: (v) => `Tối đa ${v} giờ/tuần`,
    color: 'blue',
  },
  maxMonthlyHours: {
    label: 'Giới hạn tháng',
    format: (v) => `Tối đa ${v} giờ/tháng`,
    color: 'geekblue',
  },
  minRestHours: {
    label: 'Nghỉ tối thiểu',
    format: (v) => `Nghỉ tối thiểu ${v} giờ`,
    color: 'cyan',
  },
  maxFlightHours: {
    label: 'Ngưỡng giờ bay',
    format: (v) => `Giới hạn ${v} giờ bay`,
    color: 'blue',
  },
  maxFlightCycles: {
    label: 'Ngưỡng chu kỳ bay',
    format: (v) => `Giới hạn ${v} chu kỳ bay`,
    color: 'geekblue',
  },
  maxCalendarDays: {
    label: 'Định kỳ lịch',
    format: (v) => `Định kỳ ${v} ngày`,
    color: 'cyan',
  },
  maxIncidents: {
    label: 'Ngưỡng sự cố',
    format: (v) => `Tối đa ${v} sự cố`,
    color: 'volcano',
  },
  monitorPercent: {
    label: 'Theo dõi',
    format: (v) => `Theo dõi từ ${v}%`,
    color: 'default',
  },
  warningPercent: {
    label: 'Cảnh báo',
    format: (v) => `Cảnh báo từ ${v}%`,
    color: 'orange',
  },
  healthMarginWeight: {
    label: 'Biên bảo trì',
    format: (v) => `Biên bảo trì ${Math.round(Number(v) * 100)}%`,
    color: 'blue',
  },
  workloadBalanceWeight: {
    label: 'Cân bằng tải',
    format: (v) => `Cân bằng tải ${Math.round(Number(v) * 100)}%`,
    color: 'green',
  },
  restMarginWeight: {
    label: 'Thời gian nghỉ',
    format: (v) => `Thời gian nghỉ ${Math.round(Number(v) * 100)}%`,
    color: 'cyan',
  },
  dataQualityWeight: {
    label: 'Chất lượng dữ liệu',
    format: (v) => `Chất lượng dữ liệu ${Math.round(Number(v) * 100)}%`,
    color: 'purple',
  },
}

const VERSION_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Tạo mới', color: 'blue' },
  UPDATED: { label: 'Cập nhật', color: 'geekblue' },
  ACTIVATED: { label: 'Kích hoạt', color: 'green' },
  DEACTIVATED: { label: 'Tạm tắt', color: 'default' },
}

const IMPACT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ELIGIBLE: { label: 'Đủ điều kiện', color: 'green' },
  INELIGIBLE: { label: 'Không đủ điều kiện', color: 'red' },
  AVAILABLE: { label: 'Sẵn sàng', color: 'green' },
  UNAVAILABLE: { label: 'Không khả dụng', color: 'red' },
  HEALTHY: { label: 'Tốt', color: 'green' },
  NORMAL: { label: 'Bình thường', color: 'green' },
  MONITOR: { label: 'Cần theo dõi', color: 'blue' },
  WARNING: { label: 'Cảnh báo', color: 'orange' },
  MAINTENANCE_DUE_SOON: { label: 'Sắp đến hạn bảo trì', color: 'orange' },
  MAINTENANCE_REQUIRED: { label: 'Cần bảo trì ngay', color: 'red' },
  BLOCKED: { label: 'Bị chặn phân bổ', color: 'red' },
  OVERLOADED: { label: 'Quá tải', color: 'red' },
  UNKNOWN: { label: 'Chưa xác định', color: 'default' },
}

function formatRuleChips(rules: Record<string, unknown> | null | undefined) {
  if (!rules || typeof rules !== 'object') return []
  return Object.entries(rules)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const def = RULE_LABELS[key]
      if (def) {
        return { key, text: def.format(value), color: def.color }
      }
      return { key, text: `${key}: ${String(value)}`, color: 'default' }
    })
}

interface PoliciesTabProps {
  family: PolicyFamily
  policies: PolicyResponse[]
  drones?: DroneHealthResponse[]
  staff?: StaffWorkloadResponse[]
  loading: boolean
  onRefresh: () => void
}

export function PoliciesTab({
  family,
  policies,
  drones = [],
  staff = [],
  loading,
  onRefresh,
}: PoliciesTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [createOpen, setCreateOpen] = useState(false)
  const [preview, setPreview] = useState<PolicyImpactPreview | null>(null)
  const [versions, setVersions] = useState<PolicyVersionResponse[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const filtered = policies.filter((p) => p.family === family)

  const deviceModelOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of drones) {
      if (d.modelId && !map.has(d.modelId)) {
        map.set(d.modelId, d.modelName?.trim() || d.modelId)
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name === id ? id : `${name} (${id})`,
    }))
  }, [drones])

  const workforceTargetOptions = useMemo(() => {
    const scopeGroup = {
      label: 'Phạm vi áp dụng chung',
      options: [
        { value: 'STAFF', label: 'Tất cả nhân viên vận hành (STAFF)' },
        { value: 'ALL', label: 'Toàn bộ nhân sự hệ thống (ALL)' },
      ],
    }
    if (staff.length === 0) return [scopeGroup]
    return [
      scopeGroup,
      {
        label: 'Áp dụng riêng cho từng nhân viên',
        options: staff.map((s) => ({
          value: s.staffId,
          label: s.email ? `${s.fullName} (${s.email})` : s.fullName,
        })),
      },
    ]
  }, [staff])

  const allocationTargetOptions = useMemo(
    () => [{ value: 'DEFAULT', label: 'Mặc định hệ thống (DEFAULT)' }],
    [],
  )

  const resolveTargetLabel = (targetId: string) => {
    if (family === 'WORKFORCE') {
      if (targetId === 'STAFF') return 'Tất cả nhân viên vận hành'
      if (targetId === 'ALL') return 'Toàn bộ nhân sự'
      const matched = staff.find((s) => s.staffId === targetId)
      return matched ? matched.fullName : targetId
    }
    if (family === 'MAINTENANCE') {
      const matched = drones.find((d) => d.modelId === targetId)
      return matched?.modelName ? matched.modelName : targetId
    }
    if (family === 'ALLOCATION' && targetId === 'DEFAULT') {
      return 'Mặc định hệ thống'
    }
    return targetId
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const rules: Record<string, unknown> =
        family === 'MAINTENANCE'
          ? {
              maxFlightHours: values.maxFlightHours,
              maxFlightCycles: values.maxFlightCycles ?? null,
              maxCalendarDays: values.maxCalendarDays ?? null,
              monitorPercent: values.monitorPercent ?? 60,
              warningPercent: values.warningPercent ?? 80,
            }
          : family === 'WORKFORCE'
            ? {
                maxDailyHours: values.maxDailyHours,
                maxWeeklyHours: values.maxWeeklyHours,
                minRestHours: values.minRestHours ?? 8,
                warningPercent: values.warningPercent ?? 80,
              }
            : {
                healthMarginWeight: values.healthMarginWeight ?? 0.4,
                workloadBalanceWeight: values.workloadBalanceWeight ?? 0.3,
                restMarginWeight: values.restMarginWeight ?? 0.15,
                dataQualityWeight: values.dataQualityWeight ?? 0.15,
              }

      await resourceLifecycleApi.createPolicy({
        family,
        targetId: values.targetId,
        name: values.name,
        effectiveAt: new Date().toISOString(),
        rules,
        reason: values.reason,
        expectedRevision: 0,
      })
      message.success('Đã tạo chính sách (mặc định chưa kích hoạt — hãy xem trước ảnh hưởng trước khi kích hoạt).')
      form.resetFields()
      setCreateOpen(false)
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePreview = async (policy: PolicyResponse) => {
    try {
      const result = await resourceLifecycleApi.previewPolicy(policy.id)
      setPreview(result)
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  const handleToggle = async (policy: PolicyResponse) => {
    try {
      if (policy.active) {
        await resourceLifecycleApi.deactivatePolicy(policy.id, {
          expectedRevision: policy.revision,
          reason: 'Tắt chính sách từ giao diện Admin',
        })
        message.success('Đã tắt chính sách.')
      } else {
        await resourceLifecycleApi.activatePolicy(policy.id, {
          expectedRevision: policy.revision,
          reason: 'Kích hoạt chính sách sau khi xem trước ảnh hưởng',
        })
        message.success('Đã kích hoạt chính sách và đánh giá lại nguồn lực.')
      }
      onRefresh()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  const handleVersions = async (policy: PolicyResponse) => {
    try {
      setVersions(await resourceLifecycleApi.listPolicyVersions(policy.id))
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }

  const activeCount = filtered.filter((p) => p.active).length

  return (
    <Card
      className="rl-chart-card"
      title={
        <Space>
          <span>
            {family === 'MAINTENANCE'
              ? 'Chính sách bảo trì'
              : family === 'WORKFORCE'
                ? 'Chính sách nhân sự'
                : 'Cấu hình phân bổ AI'}
          </span>
          <Tag color="green">{activeCount} đang bật</Tag>
          <Tag>{filtered.length} tổng cộng</Tag>
        </Space>
      }
      extra={
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          {t.actions.createPolicy}
        </Button>
      }
    >
      <Table<PolicyResponse>
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        pagination={{ pageSize: 8, locale: { items_per_page: '/ trang' } }}
        columns={[
          {
            title: 'Tên chính sách',
            render: (_, p) => (
              <div>
                <strong>{p.name}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Áp dụng: {resolveTargetLabel(p.targetId)} · Phiên bản {p.revision}
                </div>
              </div>
            ),
          },
          {
            title: 'Trạng thái',
            width: 140,
            render: (_, p) => (
              <Tag color={p.active ? 'green' : 'default'}>
                {p.active ? 'Đang kích hoạt' : 'Chưa kích hoạt'}
              </Tag>
            ),
          },
          {
            title: 'Quy tắc áp dụng',
            render: (_, p) => {
              const chips = formatRuleChips(p.rules)
              if (chips.length === 0) return <span style={{ color: '#94a3b8' }}>—</span>
              return (
                <Space wrap size={[6, 6]}>
                  {chips.map((chip) => (
                    <Tag key={chip.key} color={chip.color} style={{ margin: 0 }}>
                      {chip.text}
                    </Tag>
                  ))}
                </Space>
              )
            },
          },
          {
            title: 'Cập nhật lúc',
            width: 165,
            render: (_, p) => formatDateTimeOrUnknown(p.updatedAt, t.unknown),
          },
          {
            title: 'Thao tác',
            width: 310,
            render: (_, p) => (
              <Space size={[6, 6]} wrap>
                <Button size="small" onClick={() => void handlePreview(p)}>
                  {t.actions.previewImpact}
                </Button>
                <Button
                  size="small"
                  type={p.active ? 'default' : 'primary'}
                  onClick={() => void handleToggle(p)}
                >
                  {p.active ? t.actions.deactivate : t.actions.activate}
                </Button>
                <Button size="small" onClick={() => void handleVersions(p)}>
                  {t.actions.versions}
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        open={createOpen}
        title={
          family === 'MAINTENANCE'
            ? 'Tạo chính sách bảo trì'
            : family === 'WORKFORCE'
              ? 'Tạo chính sách nhân sự'
              : 'Tạo cấu hình phân bổ AI'
        }
        okText="Tạo chính sách"
        cancelText="Hủy"
        width={560}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        confirmLoading={submitting}
      >
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
            Chọn nhanh mẫu gợi ý (tự điền thông số, có thể chỉnh lại):
          </div>
          <Space wrap size={[6, 6]}>
            {POLICY_PRESETS[family].map((preset) => (
              <Button
                key={preset.key}
                size="small"
                onClick={() => form.setFieldsValue(preset.values)}
              >
                <strong>{preset.label}</strong>
                <span style={{ marginLeft: 4, color: '#64748b', fontSize: 11.5 }}>
                  ({preset.summary})
                </span>
              </Button>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="targetId"
            label={
              family === 'MAINTENANCE'
                ? 'Dòng thiết bị áp dụng'
                : family === 'WORKFORCE'
                  ? 'Đối tượng áp dụng'
                  : 'Phạm vi cấu hình'
            }
            initialValue={
              family === 'WORKFORCE'
                ? 'STAFF'
                : family === 'ALLOCATION'
                  ? 'DEFAULT'
                  : undefined
            }
            rules={[{ required: true, message: 'Chọn đối tượng áp dụng' }]}
          >
            {family === 'WORKFORCE' ? (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn phạm vi hoặc nhân viên cụ thể"
                options={workforceTargetOptions}
              />
            ) : family === 'MAINTENANCE' && deviceModelOptions.length > 0 ? (
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn dòng thiết bị (Device Model)"
                options={deviceModelOptions}
              />
            ) : family === 'ALLOCATION' ? (
              <Select options={allocationTargetOptions} />
            ) : (
              <Input placeholder="Nhập DeviceModel ID" />
            )}
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên chính sách"
            rules={[{ required: true, message: 'Nhập tên chính sách' }]}
          >
            <Input
              placeholder={
                family === 'WORKFORCE'
                  ? 'VD: Chính sách giờ làm việc chuẩn'
                  : family === 'MAINTENANCE'
                    ? 'VD: Bảo trì định kỳ 50 giờ bay'
                    : 'VD: Cấu hình trọng số mặc định'
              }
            />
          </Form.Item>
          {family === 'MAINTENANCE' && (
            <>
              <Form.Item
                name="maxFlightHours"
                label="Ngưỡng giờ bay (giờ)"
                rules={[{ required: true, message: 'Nhập ngưỡng giờ bay' }]}
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[20, 30, 50, 100].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('maxFlightHours', v)}
                      >
                        {v} giờ
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber min={1} placeholder="VD: 50" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="maxFlightCycles"
                label="Ngưỡng số chu kỳ bay (tùy chọn)"
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[50, 100, 150, 200].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('maxFlightCycles', v)}
                      >
                        {v} chu kỳ
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber min={1} placeholder="VD: 100" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name="maxCalendarDays"
                label="Ngưỡng số ngày theo lịch (tùy chọn)"
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[30, 60, 90, 180].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('maxCalendarDays', v)}
                      >
                        {v} ngày
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber min={1} placeholder="VD: 90" style={{ width: '100%' }} />
              </Form.Item>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item name="monitorPercent" label="% theo dõi" initialValue={60}>
                  <InputNumber min={1} max={98} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="warningPercent" label="% cảnh báo" initialValue={80}>
                  <InputNumber min={2} max={99} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </>
          )}
          {family === 'WORKFORCE' && (
            <>
              <Form.Item
                name="maxDailyHours"
                label="Giới hạn giờ/ngày"
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[6, 8, 10, 12].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('maxDailyHours', v)}
                      >
                        {v} giờ/ngày
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber
                  min={1}
                  placeholder="VD: 8"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="maxWeeklyHours"
                label="Giới hạn giờ/tuần"
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[32, 40, 48, 56].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('maxWeeklyHours', v)}
                      >
                        {v} giờ/tuần
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber
                  min={1}
                  placeholder="VD: 40"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="minRestHours"
                label="Thời gian nghỉ tối thiểu (giờ)"
                initialValue={8}
                extra={
                  <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                    {[8, 10, 12].map((v) => (
                      <Tag
                        key={v}
                        style={{ cursor: 'pointer', margin: 0 }}
                        onClick={() => form.setFieldValue('minRestHours', v)}
                      >
                        {v} giờ
                      </Tag>
                    ))}
                  </Space>
                }
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {family === 'ALLOCATION' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="healthMarginWeight" label="Trọng số biên bảo trì" initialValue={0.4}>
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="workloadBalanceWeight" label="Trọng số cân bằng tải" initialValue={0.3}>
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="restMarginWeight" label="Trọng số thời gian nghỉ" initialValue={0.15}>
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="dataQualityWeight" label="Trọng số chất lượng dữ liệu" initialValue={0.15}>
                <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
              </Form.Item>
            </div>
          )}
          <Form.Item
            name="reason"
            label="Lý do ban hành"
            rules={[{ required: true, message: 'Nhập lý do ban hành' }]}
            extra={
              <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                {REASON_SUGGESTIONS[family].map((text) => (
                  <Tag
                    key={text}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => form.setFieldValue('reason', text)}
                  >
                    + {text}
                  </Tag>
                ))}
              </Space>
            }
          >
            <Input.TextArea
              rows={2}
              placeholder="Mô tả ngắn gọn lý do áp dụng chính sách này"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(preview)}
        title="Xem trước ảnh hưởng chính sách"
        onCancel={() => setPreview(null)}
        footer={null}
        width={720}
      >
        {preview && (() => {
          const statusTag = (status: string) => {
            const info = IMPACT_STATUS_LABELS[String(status).toUpperCase()]
            return (
              <Tag color={info?.color ?? 'default'} style={{ marginInlineEnd: 0 }}>
                {info?.label ?? status}
              </Tag>
            )
          }
          const rows = [...preview.impactedResources].sort((a, b) => {
            const ca = a.previousStatus !== a.projectedStatus ? 0 : 1
            const cb = b.previousStatus !== b.projectedStatus ? 0 : 1
            if (ca !== cb) return ca - cb
            return (b.reasons.length > 0 ? 1 : 0) - (a.reasons.length > 0 ? 1 : 0)
          })
          const changedCount = rows.filter(
            (r) => r.previousStatus !== r.projectedStatus,
          ).length
          const violatingCount = rows.filter((r) => r.reasons.length > 0).length
          const okCount = rows.length - violatingCount
          const hasImpact = preview.newlyBlockedCount + preview.newlyWarningCount > 0
          const stat = (label: string, value: number, color: string) => (
            <div
              style={{
                flex: '1 1 120px',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #f0f0f0',
                background: '#fafafa',
              }}
            >
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: '#595959', fontSize: 13 }}>
                Mô phỏng: nếu áp dụng chính sách này ngay bây giờ, trạng thái
                phân bổ của từng nguồn lực sẽ thay đổi như thế nào. Chưa có gì
                được lưu.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stat('Đã kiểm tra', preview.totalEvaluated, '#262626')}
                {stat('Sẽ bị chặn thêm', preview.newlyBlockedCount, '#cf1322')}
                {stat('Sẽ bị cảnh báo thêm', preview.newlyWarningCount, '#d46b08')}
                {stat('Đạt quy tắc', okCount, '#389e0d')}
              </div>
              <Alert
                type={hasImpact ? 'warning' : 'success'}
                showIcon
                message={
                  hasImpact
                    ? `Áp dụng chính sách sẽ làm thay đổi trạng thái của ${changedCount} nguồn lực.`
                    : 'Áp dụng chính sách không làm thay đổi trạng thái của nguồn lực nào.'
                }
                description={
                  !hasImpact && violatingCount > 0
                    ? `${violatingCount} nguồn lực đang vi phạm quy tắc nhưng vốn đã bị chặn từ trước, nên không bị ảnh hưởng thêm.`
                    : undefined
                }
              />
              <Table
                rowKey="resourceId"
                size="small"
                pagination={false}
                scroll={{ y: 360 }}
                dataSource={rows}
                columns={[
                  {
                    title: 'Nguồn lực',
                    dataIndex: 'displayName',
                    width: 170,
                  },
                  {
                    title: 'Trạng thái (hiện tại → sau áp dụng)',
                    width: 260,
                    render: (_, r) => {
                      const changed = r.previousStatus !== r.projectedStatus
                      return (
                        <Space size={6} wrap>
                          {statusTag(r.previousStatus)}
                          {changed ? (
                            <>
                              <span style={{ color: '#8c8c8c' }}>→</span>
                              {statusTag(r.projectedStatus)}
                            </>
                          ) : (
                            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                              Không đổi
                            </span>
                          )}
                        </Space>
                      )
                    },
                  },
                  {
                    title: 'Vi phạm quy tắc',
                    render: (_, r) =>
                      r.reasons.length ? (
                        <ul style={{ margin: 0, paddingInlineStart: 16 }}>
                          {r.reasons.map((reason) => (
                            <li key={reason}>{reasonVi(reason)}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#389e0d' }}>✓ Đạt tất cả quy tắc</span>
                      ),
                  },
                ]}
              />
            </div>
          )
        })()}
      </Modal>

      <Modal
        open={Boolean(versions)}
        title="Lịch sử phiên bản chính sách"
        onCancel={() => setVersions(null)}
        footer={null}
        width={700}
      >
        <Table<PolicyVersionResponse>
          rowKey="revision"
          size="small"
          pagination={false}
          dataSource={versions ?? []}
          columns={[
            {
              title: 'Phiên bản',
              dataIndex: 'revision',
              render: (rev: number) => `Phiên bản ${rev}`,
            },
            {
              title: 'Hành động',
              dataIndex: 'action',
              render: (action: string) => {
                const info = VERSION_ACTION_LABELS[action]
                return (
                  <Tag color={info?.color ?? 'default'}>
                    {info?.label ?? action}
                  </Tag>
                )
              },
            },
            {
              title: 'Người thực hiện',
              dataIndex: 'actorId',
              render: (actorId: string) => auditActorVi(actorId),
            },
            {
              title: 'Thời gian',
              render: (_, v) => formatDateTimeOrUnknown(v.createdAt, t.unknown),
            },
          ]}
        />
      </Modal>
    </Card>
  )
}

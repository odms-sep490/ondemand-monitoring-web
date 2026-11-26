import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import { resourceLifecycleApi } from '../api'
import { formatDateTimeOrUnknown } from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type {
  PolicyFamily,
  PolicyImpactPreview,
  PolicyResponse,
  PolicyVersionResponse,
} from '../types'

interface PoliciesTabProps {
  family: PolicyFamily
  policies: PolicyResponse[]
  loading: boolean
  onRefresh: () => void
}

export function PoliciesTab({ family, policies, loading, onRefresh }: PoliciesTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [createOpen, setCreateOpen] = useState(false)
  const [preview, setPreview] = useState<PolicyImpactPreview | null>(null)
  const [versions, setVersions] = useState<PolicyVersionResponse[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const filtered = policies.filter((p) => p.family === family)

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
        pagination={{ pageSize: 8 }}
        columns={[
          {
            title: 'Tên chính sách',
            render: (_, p) => (
              <div>
                <strong>{p.name}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Áp dụng: {p.targetId} · Phiên bản #{p.revision}
                </div>
              </div>
            ),
          },
          {
            title: 'Trạng thái',
            render: (_, p) => (
              <Tag color={p.active ? 'green' : 'default'}>
                {p.active ? 'Đang kích hoạt' : 'Chưa kích hoạt'}
              </Tag>
            ),
          },
          {
            title: 'Quy tắc (JSON)',
            render: (_, p) => (
              <code style={{ fontSize: 12 }}>{JSON.stringify(p.rules)}</code>
            ),
          },
          {
            title: 'Cập nhật lúc',
            render: (_, p) => formatDateTimeOrUnknown(p.updatedAt, t.unknown),
          },
          {
            title: 'Thao tác',
            render: (_, p) => (
              <Space wrap>
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
        title={`Tạo chính sách ${family}`}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="targetId"
            label={
              family === 'MAINTENANCE'
                ? 'DeviceModel ID'
                : family === 'WORKFORCE'
                  ? 'Đối tượng (ALL / STAFF / staffId)'
                  : 'Mã cấu hình (DEFAULT)'
            }
            initialValue={family === 'WORKFORCE' ? 'STAFF' : family === 'ALLOCATION' ? 'DEFAULT' : undefined}
            rules={[{ required: true, message: 'Nhập đối tượng áp dụng' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên chính sách"
            rules={[{ required: true, message: 'Nhập tên chính sách' }]}
          >
            <Input />
          </Form.Item>
          {family === 'MAINTENANCE' && (
            <>
              <Form.Item
                name="maxFlightHours"
                label="Ngưỡng giờ bay (giờ)"
                rules={[{ required: true, message: 'Nhập ngưỡng giờ bay' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="maxFlightCycles" label="Ngưỡng số chu kỳ bay (tùy chọn)">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="maxCalendarDays" label="Ngưỡng số ngày theo lịch (tùy chọn)">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="monitorPercent" label="% theo dõi" initialValue={60}>
                <InputNumber min={1} max={98} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="warningPercent" label="% cảnh báo" initialValue={80}>
                <InputNumber min={2} max={99} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {family === 'WORKFORCE' && (
            <>
              <Form.Item name="maxDailyHours" label="Giới hạn giờ/ngày">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="maxWeeklyHours" label="Giới hạn giờ/tuần">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="minRestHours" label="Thời gian nghỉ tối thiểu (giờ)" initialValue={8}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {family === 'ALLOCATION' && (
            <>
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
            </>
          )}
          <Form.Item
            name="reason"
            label="Lý do ban hành"
            rules={[{ required: true, message: 'Nhập lý do ban hành' }]}
          >
            <Input.TextArea rows={2} />
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
        {preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Alert
              type="info"
              showIcon
              message={`Đã đánh giá ${preview.totalEvaluated} đối tượng: ${preview.newlyBlockedCount} mới bị chặn, ${preview.newlyWarningCount} mới cảnh báo.`}
            />
            <Table
              rowKey="resourceId"
              size="small"
              pagination={false}
              dataSource={preview.impactedResources}
              columns={[
                { title: 'Nguồn lực', dataIndex: 'displayName' },
                { title: 'Trước', dataIndex: 'previousStatus' },
                { title: 'Sau khi áp dụng', dataIndex: 'projectedStatus' },
                {
                  title: 'Lý do',
                  render: (_, r) => r.reasons.join(', ') || '—',
                },
              ]}
            />
          </div>
        )}
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
            { title: 'Rev', dataIndex: 'revision' },
            { title: 'Hành động', dataIndex: 'action' },
            { title: 'Người thực hiện', dataIndex: 'actorId' },
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

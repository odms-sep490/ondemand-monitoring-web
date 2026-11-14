import { useState } from 'react'
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd'
import { apiRequest } from '../../../../../shared/api/httpClient'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
type Criterion = {
  code: string
  title: string
  description: string
  required: boolean
  type: 'AUTO' | 'MANUAL'
}
type InputValues = Pick<Criterion, 'title' | 'description' | 'required'>
const endpoint = '/api/admin/order-review-criteria'
export function OrderCriteriaTab() {
  const query = useApiQuery(
    (signal) => apiRequest<Criterion[]>(endpoint, { signal }),
    [],
  )
  const [editing, setEditing] = useState<Criterion | null | undefined>(
    undefined,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm<InputValues>()
  const open = (row: Criterion | null) => {
    setError(null)
    setEditing(row)
    form.setFieldsValue(row ?? { title: '', description: '', required: true })
  }
  const save = async () => {
    const values = await form.validateFields()
    setSaving(true)
    setError(null)
    try {
      await apiRequest(
        endpoint + (editing ? '/' + encodeURIComponent(editing.code) : ''),
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(values) },
      )
      setEditing(undefined)
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được tiêu chí')
    } finally {
      setSaving(false)
    }
  }
  const remove = async (code: string) => {
    try {
      await apiRequest(endpoint + '/' + encodeURIComponent(code), {
        method: 'DELETE',
      })
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xóa được tiêu chí')
    }
  }
  return (
    <section
      style={{
        padding: 24,
        background: 'var(--ui-surface,white)',
        borderRadius: 14,
      }}
    >
      <Space
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Tiêu chí duyệt đơn hàng</h2>
          <p>
            Quản lý các điều kiện dùng khi Manager đánh giá đơn. Xóa tiêu chí sẽ
            ngừng áp dụng, kết quả cũ vẫn được lưu.
          </p>
        </div>
        <Button type="primary" onClick={() => open(null)}>
          Thêm tiêu chí
        </Button>
      </Space>
      {Boolean(error || query.error) && (
        <Alert
          type="error"
          showIcon
          message={error ?? 'Không tải được tiêu chí'}
          action={<Button onClick={query.reload}>Thử lại</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        rowKey="code"
        loading={query.loading}
        dataSource={query.data ?? []}
        pagination={false}
        scroll={{ x: 650 }}
        columns={[
          {
            title: 'Tiêu chí',
            dataIndex: 'title',
            render: (_, r) => (
              <>
                <strong>{r.title}</strong>
                <div style={{ color: '#617188', marginTop: 4 }}>
                  {r.description}
                </div>
              </>
            ),
          },
          {
            title: 'Đánh giá',
            dataIndex: 'type',
            width: 150,
            render: (v) => (
              <Tag>{v === 'AUTO' ? 'Hệ thống' : 'Manager xác nhận'}</Tag>
            ),
          },
          {
            title: 'Bắt buộc',
            dataIndex: 'required',
            width: 100,
            render: (v) => (v ? 'Có' : 'Không'),
          },
          {
            title: 'Thao tác',
            width: 150,
            render: (_, r) => (
              <Space>
                <Button onClick={() => open(r)}>Sửa</Button>
                <Popconfirm
                  title="Xóa tiêu chí này?"
                  description="Tiêu chí sẽ không còn dùng để duyệt đơn."
                  onConfirm={() => remove(r.code)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger>Xóa</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        open={editing !== undefined}
        title={editing ? 'Sửa tiêu chí' : 'Thêm tiêu chí'}
        onCancel={() => {
          if (!saving) setEditing(undefined)
        }}
        onOk={() => void save()}
        confirmLoading={saving}
        okText="Lưu tiêu chí"
        cancelText="Hủy"
        destroyOnHidden
      >
        {error && <Alert type="error" message={error} />}
        <Form form={form} layout="vertical" style={{ marginTop: 18 }}>
          <Form.Item
            name="title"
            label="Tên tiêu chí"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Nhập tên tiêu chí',
              },
              { max: 150 },
            ]}
          >
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả đánh giá"
            rules={[
              { required: true, whitespace: true, message: 'Nhập mô tả' },
              { max: 1000 },
            ]}
          >
            <Input.TextArea rows={3} maxLength={1000} />
          </Form.Item>
          <Form.Item
            name="required"
            label="Bắt buộc đạt để duyệt đơn"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}

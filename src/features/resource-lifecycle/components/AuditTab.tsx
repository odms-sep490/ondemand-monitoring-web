import { useMemo, useState } from 'react'
import { Card, Input, Table, Tag } from 'antd'
import { auditActionVi, formatDateTimeOrUnknown } from '../formatters'
import { resourceLifecycleMessages } from '../messages'
import { useI18n } from '../../../shared/i18n'
import type { AuditLogResponse } from '../types'

interface AuditTabProps {
  audits: AuditLogResponse[]
  loading: boolean
}

export function AuditTab({ audits, loading }: AuditTabProps) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return audits
    return audits.filter(
      (a) =>
        a.action.toLowerCase().includes(q) ||
        a.actorId.toLowerCase().includes(q) ||
        a.entityId.toLowerCase().includes(q) ||
        (a.reason ?? '').toLowerCase().includes(q),
    )
  }, [audits, search])

  return (
    <Card className="rl-chart-card" title={`Nhật ký kiểm toán nguồn lực (${filtered.length})`}>
      <div className="rl-toolbar">
        <Input.Search
          allowClear
          placeholder="Tìm theo hành động, người thực hiện hoặc lý do…"
          style={{ maxWidth: 340 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Table<AuditLogResponse>
        rowKey="id"
        loading={loading}
        size="small"
        dataSource={filtered}
        pagination={{ pageSize: 12 }}
        columns={[
          {
            title: 'Thời gian',
            render: (_, row) => formatDateTimeOrUnknown(row.createdAt, t.unknown),
          },
          {
            title: 'Hành động',
            dataIndex: 'action',
            render: (action: string) => (
              <Tag
                color={
                  action.includes('FAILED') || action.includes('REJECT')
                    ? 'red'
                    : action.includes('PASSED') || action.includes('ACTIVATED')
                      ? 'green'
                      : 'blue'
                }
              >
                {auditActionVi(action)}
              </Tag>
            ),
          },
          { title: 'Người thực hiện', dataIndex: 'actorId' },
          { title: 'Mã đối tượng', dataIndex: 'entityId' },
          { title: 'Lý do', dataIndex: 'reason' },
        ]}
      />
    </Card>
  )
}

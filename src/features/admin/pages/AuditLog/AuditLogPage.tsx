import { useState } from 'react'

import { ExportOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../../shared/components/antd'
import { AdminLoading } from '../../components/common/AdminLoading'
import { MockDataTag } from '../../components/common/MockDataTag'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import type { AuditEntry } from '../../types/auditLog'
import { AuditDetailModal } from './components/AuditDetailModal'
import {
  AuditFilters,
  EMPTY_AUDIT_FILTERS,
  type AuditFilterState,
} from './components/AuditFilters'
import { auditPagerMessages } from './components/AuditPager.messages'
import { AuditTable } from './components/AuditTable'
import { auditLogPageMessages } from './AuditLogPage.messages'

const PAGE_SIZE = 10

export function AuditLogPage() {
  const { t } = useI18n(auditLogPageMessages)
  const { t: tp } = useI18n(auditPagerMessages)
  const [filters, setFilters] = useState<AuditFilterState>(EMPTY_AUDIT_FILTERS)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const [exported, setExported] = useState(false)

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminApi.listAuditLog(
        {
          action: filters.action || undefined,
          entityType: filters.entityType || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    [filters, page],
  )

  return (
    <div className="mgr-view">
      <PageHeader
        title={t.title}
        description={
          <>
            {t.subtitle} <MockDataTag />
          </>
        }
        actions={
          <Button icon={<ExportOutlined aria-hidden="true" aria-label={undefined} />} onClick={() => setExported(true)}>
            {t.exportCsv}
          </Button>
        }
      />
      {exported && <Alert type="success" showIcon role="status" message={t.exportSuccess} />}
      <AuditFilters
        value={filters}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
      />
      {loading && !data && <AdminLoading />}
      {!loading && !data && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.items.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <AuditTable
            items={data.items}
            pagination={{
              current: page,
              pageSize: PAGE_SIZE,
              total: data.total,
              showSizeChanger: false,
              position: ['bottomRight'],
              showTotal: (total) => `${tp.total}: ${total}`,
              locale: { prev_page: tp.prev, next_page: tp.next },
              onChange: setPage,
            }}
            onView={setSelected}
          />
        </CardComponent>
      )}
      {selected && <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

import { EditOutlined, PlusOutlined, ProfileOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Select, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  FilterBar,
  PageHeader,
  StatusTag,
  TableComponent,
  mgrPopupContainer,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import { AdminLoading } from '../../components/common/AdminLoading'
import { adminHref } from '../../routes'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistPagination, ChecklistLoadError } from './ChecklistUi'
import { ChecklistConfigModal } from './ChecklistConfigModal'

export function ChecklistCatalogPage() {
  const { t, lang } = useI18n(checklistMessages)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(0)
  const [editor, setEditor] = useState<ChecklistDefinition | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageId, setUsageId] = useState<string | null>(null)
  const query = useApiQuery(
    (signal) =>
      checklistsApi.list(
        search,
        active === '' ? undefined : active === 'true',
        page,
        signal,
      ),
    [search, active, page],
  )
  async function toggle(row: ChecklistDefinition) {
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.status(row.id, !row.isActive)
      query.reload()
    } catch (cause) {
      setError(checklistError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  const columns: ColumnsType<ChecklistDefinition> = [
    {
      title: t.content,
      key: 'content',
      width: 280,
      render: (_, row) => (
        <span className="adm-wrap checklist-content-cell">{row.content}</span>
      ),
    },
    {
      title: t.filter,
      key: 'status',
      width: 140,
      render: (_, row) => (
        <StatusTag tone={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? t.active : t.inactive}
        </StatusTag>
      ),
    },
    {
      title: t.priceColumn,
      key: 'price',
      render: (_, row) => (
        <span className="mgr-cell-stack">
          <strong>{formatVnd(row.basePrice ?? 0)}</strong>
          <span className="mgr-cell-sub">
            {row.includedImageCount ?? 0} {t.imagesShort} ·{' '}
            {row.includedVideoCount ?? 0} {t.videosShort}
            {row.pricingProfile ? ` · ${row.pricingProfile}` : ''}
          </span>
        </span>
      ),
    },
    {
      title: t.usage,
      key: 'usage',
      render: (_, row) => (
        <Button size="small" onClick={() => setUsageId(row.id)}>
          {t.usedBy(row.usedByServiceCount ?? 0, row.usedByOrderCount ?? 0)}
        </Button>
      ),
    },
    {
      title: t.updated,
      key: 'updated',
      responsive: ['lg'],
      render: (_, row) => (
        <span className="mgr-cell-sub mgr-nowrap">
          {new Date(row.updatedAt ?? row.createdAt).toLocaleString(
            lang === 'vi' ? 'vi-VN' : 'en-US',
          )}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Space size={6} wrap>
          <Button
            size="small"
            icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
            disabled={busy}
            onClick={() => setEditor(row)}
          >
            {t.edit}
          </Button>
          <Button
            size="small"
            danger={row.isActive}
            disabled={busy}
            onClick={() => void toggle(row)}
          >
            {row.isActive ? t.deactivate : t.reactivate}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="mgr-view checklist-page">
      <PageHeader
        title={t.title}
        description={t.catalogSubtitle}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
            onClick={() => setEditor('new')}
          >
            {t.add}
          </Button>
        }
      />
      <FilterBar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value)
            setPage(0)
          },
          placeholder: t.search,
          ariaLabel: t.search,
        }}
        end={
          <>
            <Select
              className="adm-filter-select"
              aria-label={t.filter}
              value={active}
              onChange={(value) => {
                setActive(value)
                setPage(0)
              }}
              getPopupContainer={mgrPopupContainer}
              options={[
                { value: '', label: t.all },
                { value: 'true', label: t.active },
                { value: 'false', label: t.inactive },
              ]}
            />
            <Button
              icon={
                <ProfileOutlined aria-hidden="true" aria-label={undefined} />
              }
              href={adminHref({ screen: 'serviceChecklists' })}
            >
              {t.template}
            </Button>
          </>
        }
      />
      {error && <Alert type="error" showIcon role="alert" message={error} />}
      {query.loading && <AdminLoading />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.catalogLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          {query.data.items.length === 0 ? (
            <EmptyState title={t.empty} />
          ) : (
            <TableComponent<ChecklistDefinition>
              rowKey="id"
              columns={columns}
              dataSource={query.data.items}
              pagination={false}
              className="adm-wide-table"
            />
          )}
          <ChecklistPagination
            page={page}
            totalPages={query.data.totalPages}
            first={query.data.first}
            last={query.data.last}
            change={setPage}
          />
        </CardComponent>
      )}
      <Typography.Paragraph type="secondary" className="checklist-banner">
        {t.future}
      </Typography.Paragraph>
      {editor && (
        <ChecklistConfigModal
          checklist={editor === 'new' ? undefined : editor}
          close={() => setEditor(null)}
          saved={() => {
            setEditor(null)
            query.reload()
          }}
        />
      )}
      {usageId && (
        <ChecklistUsage
          key={usageId}
          id={usageId}
          close={() => setUsageId(null)}
        />
      )}
    </div>
  )
}

function ChecklistUsage({ id, close }: { id: string; close: () => void }) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.services(id, signal),
    [id],
  )
  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      title={t.usage}
      onCancel={close}
      footer={<Button onClick={close}>{t.close}</Button>}
    >
      {query.loading && <AdminLoading />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.catalogLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <ul className="checklist-usage-list">
          {query.data.map((row) => (
            <li key={row.id}>
              <a
                href={adminHref({
                  screen: 'serviceChecklists',
                  serviceId: row.serviceId,
                })}
              >
                {row.serviceName}
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.data?.length === 0 && <EmptyState title={t.noneUsed} />}
    </Modal>
  )
}

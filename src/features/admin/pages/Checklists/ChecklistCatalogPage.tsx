import { CheckSquareOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Select, Skeleton, Typography } from 'antd'
import { useState } from 'react'

import {
  CardComponent,
  FilterBar,
  PageHeader,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistCatalogTable } from './ChecklistCatalogTable'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { ChecklistLoadError, ChecklistPagination } from './ChecklistUi'
import { ChecklistUsage } from './ChecklistUsage'

export function ChecklistCatalogPage() {
  const { t } = useI18n(checklistMessages)
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
              options={[
                { value: '', label: t.all },
                { value: 'true', label: t.active },
                { value: 'false', label: t.inactive },
              ]}
            />
            <Button
              icon={
                <CheckSquareOutlined
                  aria-hidden="true"
                  aria-label={undefined}
                />
              }
              href={adminHref({ screen: 'serviceChecklists' })}
            >
              {t.template}
            </Button>
          </>
        }
      />
      {error && <Alert type="error" showIcon message={error} role="alert" />}
      <CardComponent styles={{ body: { padding: 0 } }}>
        {query.loading && (
          <Skeleton active aria-busy="true" className="adm-card-pad" />
        )}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.catalogLoadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <>
            <ChecklistCatalogTable
              rows={query.data.items}
              busy={busy}
              onUsage={setUsageId}
              onEdit={setEditor}
              onToggle={(row) => void toggle(row)}
            />
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              change={setPage}
            />
          </>
        )}
      </CardComponent>
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

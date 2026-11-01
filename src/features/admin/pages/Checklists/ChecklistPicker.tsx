import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Input, Radio, Skeleton } from 'antd'
import { useState } from 'react'

import { EmptyState } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { AdminModal } from '../../components/common/AdminModal'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { checklistError } from './checklistError'
import { checklistMessages } from './checklists.messages'
import { ChecklistLoadError, ChecklistPagination } from './ChecklistUi'

export function ChecklistPicker({
  serviceId,
  rows,
  close,
  saved,
}: {
  serviceId: string
  rows: ServiceChecklist[]
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const query = useApiQuery(
    (signal) => checklistsApi.list(search, true, page, signal),
    [search, page],
  )
  const assigned = new Set(rows.map((row) => row.checklistId))
  const candidates =
    query.data?.items.filter((row) => row.isActive && !assigned.has(row.id)) ??
    []
  const canAssign =
    !busy &&
    !!selected &&
    !query.loading &&
    query.error === undefined &&
    candidates.some((row) => row.id === selected)

  async function assign() {
    if (!canAssign || !selected) return
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.assign(serviceId, selected, rows.length)
      saved()
    } catch (cause) {
      setError(checklistError(cause, t))
      query.reload()
    } finally {
      setBusy(false)
    }
  }
  function changePage(next: number) {
    setPage(next)
    setSelected(null)
  }
  return (
    <AdminModal
      title={t.pick}
      subtitle={t.snapshotHint}
      width={620}
      onClose={() => {
        if (!busy) close()
      }}
      footer={
        <>
          <Button disabled={busy} onClick={close}>
            {t.cancel}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
            disabled={!canAssign}
            onClick={() => void assign()}
          >
            {busy ? t.saving : t.add}
          </Button>
        </>
      }
    >
      <div className="checklist-dialog">
        <Input
          allowClear
          prefix={<SearchOutlined aria-hidden="true" aria-label={undefined} />}
          aria-label={t.search}
          placeholder={t.search}
          value={search}
          disabled={busy}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
            setSelected(null)
          }}
        />
        {error && <Alert type="error" showIcon role="alert" message={error} />}
        {query.loading && <Skeleton active aria-busy="true" />}
        {query.error !== undefined && (
          <ChecklistLoadError
            title={t.catalogLoadError}
            error={query.error}
            retry={query.reload}
          />
        )}
        {!query.loading && query.error === undefined && query.data && (
          <>
            {candidates.length > 0 ? (
              <Radio.Group
                className="checklist-candidates"
                value={selected}
                disabled={busy}
                onChange={(event) => setSelected(event.target.value)}
              >
                {candidates.map((row) => (
                  <Radio
                    key={row.id}
                    value={row.id}
                    className="checklist-candidate"
                  >
                    {row.content}
                  </Radio>
                ))}
              </Radio.Group>
            ) : (
              <EmptyState title={t.noCandidates} />
            )}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              busy={busy}
              change={changePage}
            />
          </>
        )}
      </div>
    </AdminModal>
  )
}

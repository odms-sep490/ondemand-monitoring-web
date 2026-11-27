import { useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { Icon } from '../../../../shared/components/Icon'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import { Modal, EmptyState } from '../../../../shared/components/ui'
import { checklistsApi, type ServiceChecklist } from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistPagination, ChecklistLoadError } from './ChecklistUi'
import './checklists.css'

export function ChecklistPicker({
  serviceId,
  rows,
  close,
  saved,
  changed,
}: {
  serviceId: string
  rows: ServiceChecklist[]
  close: () => void
  saved: () => void
  changed: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const query = useApiQuery(
    (signal) => checklistsApi.list(search, true, page, signal),
    [search, page],
  )
  const assigned = new Set([
    ...rows.map((row) => row.checklistId),
    ...completed,
  ])
  const candidates =
    query.data?.items.filter((row) => row.isActive && !assigned.has(row.id)) ??
    []
  const allVisibleSelected =
    candidates.length > 0 && candidates.every((row) => selected.has(row.id))
  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  async function assign() {
    if (
      saving.current ||
      selected.size === 0 ||
      query.loading ||
      query.error !== undefined
    )
      return
    saving.current = true
    setBusy(true)
    setError(null)
    const ids = [...selected]
    const done = new Set<string>()
    function markCompleted(id: string) {
      done.add(id)
      setCompleted((current) => new Set([...current, id]))
      setSelected((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
    try {
      // Reconcile previous timeouts and concurrent additions before retrying POSTs.
      const current = await checklistsApi.template(serviceId)
      const currentIds = new Set(current.map((row) => row.checklistId))
      let position = current.length
      for (const id of ids) {
        if (!currentIds.has(id)) {
          await checklistsApi.assign(serviceId, id, position++)
        }
        markCompleted(id)
      }
      saved()
    } catch (cause) {
      setError(
        `${t.partialAssignment(done.size, ids.length)} ${checklistError(cause, t)}`,
      )
      if (done.size > 0) changed()
      query.reload()
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  return (
    <Modal
      title={t.pick}
      subtitle={t.snapshotHint}
      icon="clipboard"
      width={620}
      onClose={() => {
        if (!saving.current) close()
      }}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={busy}
            onClick={close}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={
              busy ||
              selected.size === 0 ||
              query.loading ||
              query.error !== undefined
            }
            onClick={() => void assign()}
          >
            <Icon name="plus" width={16} height={16} aria-hidden="true" />
            {busy
              ? t.saving
              : selected.size
                ? t.addSelected(selected.size)
                : t.add}
          </button>
        </>
      }
    >
      <div className="checklist-dialog checklist-picker-dialog">
        <div className="checklist-search">
          <Icon name="search" width={16} height={16} aria-hidden="true" />
          <input
            className="odm-inp"
            aria-label={t.search}
            placeholder={t.search}
            type="search"
            value={search}
            disabled={busy}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="checklist-picker-toolbar">
          <span role="status">{t.selectedChecklists(selected.size)}</span>
          <div>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-sm"
              aria-pressed={allVisibleSelected}
              disabled={
                busy ||
                query.loading ||
                query.error !== undefined ||
                candidates.length === 0
              }
              onClick={() =>
                setSelected((current) => {
                  const next = new Set(current)
                  for (const row of candidates) {
                    if (allVisibleSelected) next.delete(row.id)
                    else next.add(row.id)
                  }
                  return next
                })
              }
            >
              {allVisibleSelected ? t.unselectPage : t.selectPage}
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-sm"
                disabled={busy}
                onClick={() => setSelected(new Set())}
              >
                {t.clearSelection}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="checklist-banner is-error" role="alert">
            {error}
          </p>
        )}
        {query.loading && <LoadingState />}
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
              <ul className="checklist-candidates">
                {candidates.map((row) => (
                  <li key={row.id}>
                    <label className="checklist-candidate">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        disabled={busy}
                        onChange={() => toggle(row.id)}
                      />
                      <span>{row.content}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t.noCandidates} />
            )}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              busy={busy}
              change={setPage}
            />
          </>
        )}
      </div>
    </Modal>
  )
}

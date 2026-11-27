import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import {
  Modal,
  Button,
  Card,
  EmptyState,
  StatusBadge,
} from '../../../../shared/components/ui'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { Icon } from '../../../../shared/components/Icon'
import { ChecklistPagination, ChecklistLoadError } from './ChecklistUi'
import { ChecklistConfigModal } from './ChecklistConfigModal'
import { fmtDateTime } from '../../lib/accountStatus'
import './checklistLibrary.css'

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
  function clearFilters() {
    setSearch('')
    setActive('')
    setPage(0)
  }
  return (
    <div className="checklist-page checklist-library">
      <header className="checklist-library-header">
        <span className="checklist-library-icon" aria-hidden="true">
          <Icon name="clipboard" width={26} height={26} />
        </span>
        <div>
          <h1>{t.title}</h1>
          <p>{t.catalogSubtitle}</p>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor('new')}>
          {t.add}
        </Button>
      </header>
      <div className="checklist-library-toolbar">
        <div className="checklist-library-filters">
          <label className="checklist-library-filter checklist-library-search">
            <span>{t.librarySearchLabel}</span>
            <span className="checklist-library-search-input">
              <Icon name="search" width={16} height={16} aria-hidden="true" />
              <input
                className="odm-inp"
                type="search"
                aria-label={t.search}
                placeholder={t.search}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
              />
            </span>
          </label>
          <label className="checklist-library-filter">
            <span>{t.filter}</span>
            <select
              className="odm-inp"
              aria-label={t.filter}
              value={active}
              onChange={(e) => {
                setActive(e.target.value)
                setPage(0)
              }}
            >
              <option value="">{t.all}</option>
              <option value="true">{t.active}</option>
              <option value="false">{t.inactive}</option>
            </select>
          </label>
          <Button
            variant="ghost"
            icon="x"
            size="sm"
            disabled={!search && !active}
            onClick={clearFilters}
          >
            {t.libraryClear}
          </Button>
        </div>
        <div className="checklist-library-toolbar-actions">
          <Button
            icon="activity"
            onClick={query.reload}
            disabled={query.loading || busy}
          >
            {t.libraryRefresh}
          </Button>
          <Button
            icon="clipboard"
            href={adminHref({ screen: 'serviceChecklists' })}
          >
            {t.template}
          </Button>
        </div>
      </div>
      <div className="checklist-library-summary" role="status">
        {query.loading
          ? t.libraryLoading
          : query.error !== undefined
            ? t.catalogLoadError
            : query.data
              ? t.libraryResults(query.data.totalItems)
              : ''}
      </div>
      <Card className="checklist-library-card" flush>
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
            <div className="ui-table-scroll">
              <table className="odm-adm-table checklist-table">
                <thead>
                  <tr>
                    <th scope="col">{t.content}</th>
                    <th scope="col">{t.filter}</th>
                    <th scope="col">{t.evidenceColumn}</th>
                    <th scope="col">{t.usage}</th>
                    <th scope="col">{t.updated}</th>
                    <th scope="col">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      <td className="adm-wrap checklist-content-cell">
                        <span className="checklist-library-content">
                          {row.content}
                        </span>
                        {row.description && (
                          <span
                            className="checklist-library-description"
                            title={row.description}
                          >
                            {row.description}
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          tone={row.isActive ? 'success' : 'neutral'}
                        >
                          {row.isActive ? t.active : t.inactive}
                        </StatusBadge>
                      </td>
                      <td>
                        <div className="checklist-library-evidence">
                          <span>
                            <Icon
                              name="camera"
                              width={14}
                              height={14}
                              aria-hidden="true"
                            />
                            {row.includedImageCount ?? 0} {t.imagesShort}
                          </span>
                          <span>
                            <Icon
                              name="file-text"
                              width={14}
                              height={14}
                              aria-hidden="true"
                            />
                            {row.includedVideoCount ?? 0} {t.videosShort}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="odm-btn odm-btn-gh odm-btn-sm checklist-library-usage"
                          onClick={() => setUsageId(row.id)}
                        >
                          {t.usedBy(
                            row.usedByServiceCount ?? 0,
                            row.usedByOrderCount ?? 0,
                          )}
                        </button>
                      </td>
                      <td className="adm-cell-mono">
                        {fmtDateTime(row.updatedAt ?? row.createdAt, lang)}
                      </td>
                      <td>
                        <div className="checklist-actions">
                          <button
                            className="odm-btn odm-btn-gh odm-btn-sm checklist-library-configure"
                            aria-label={t.edit}
                            title={t.edit}
                            disabled={busy}
                            onClick={() => setEditor(row)}
                          >
                            <Icon
                              name="edit"
                              width={15}
                              height={15}
                              aria-hidden="true"
                            />
                            {t.configure}
                          </button>{' '}
                          <button
                            className={
                              'odm-btn odm-btn-gh odm-btn-sm checklist-library-toggle' +
                              (row.isActive ? ' checklist-danger' : '')
                            }
                            disabled={busy}
                            aria-label={
                              row.isActive ? t.deactivate : t.reactivate
                            }
                            title={row.isActive ? t.deactivate : t.reactivate}
                            onClick={() => void toggle(row)}
                          >
                            {row.isActive ? t.deactivate : t.reactivate}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.items.length && (
              <EmptyState
                title={t.empty}
                action={
                  search || active ? (
                    <Button onClick={clearFilters}>{t.libraryClear}</Button>
                  ) : undefined
                }
              />
            )}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              change={setPage}
              busy={busy}
            />
          </>
        )}
      </Card>
      <p className="checklist-library-hint">
        <Icon name="shield" width={15} height={15} aria-hidden="true" />
        <span>{t.future}</span>
      </p>
      {editor && (
        <ChecklistConfigModal
          checklist={editor === 'new' ? undefined : editor}
          close={() => setEditor(null)}
          saved={(updated) => {
            setEditor(updated ?? null)
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
      title={t.usage}
      icon="clipboard"
      onClose={close}
      footer={
        <button type="button" className="odm-btn" onClick={close}>
          {t.close}
        </button>
      }
    >
      {query.loading && <LoadingState />}
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
                <Icon
                  name="arrow-right"
                  width={16}
                  height={16}
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.data?.length === 0 && <EmptyState title={t.noneUsed} />}
    </Modal>
  )
}

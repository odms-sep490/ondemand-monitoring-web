import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import {
  Modal,
  PageHeader,
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
import { formatVnd } from '../../../../shared/lib/formatVnd'
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
  return (
    <div className="checklist-page">
      <PageHeader
        title={t.title}
        subtitle={t.catalogSubtitle}
        actions={
          <button
            className="odm-btn odm-btn-p"
            onClick={() => setEditor('new')}
          >
            <Icon name="plus" width={16} height={16} aria-hidden="true" />
            {t.add}
          </button>
        }
      />
      <Card flush>
        <div className="checklist-toolbar">
          <div className="checklist-search">
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
          </div>
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
          <a
            className="odm-btn"
            href={adminHref({ screen: 'serviceChecklists' })}
          >
            <Icon name="clipboard" width={16} height={16} aria-hidden="true" />
            {t.template}
          </a>
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
            <div className="ui-table-scroll">
              <table className="odm-adm-table checklist-table">
                <thead>
                  <tr>
                    <th>{t.content}</th>
                    <th>{t.filter}</th>
                    <th>{t.priceColumn}</th>
                    <th>{t.usage}</th>
                    <th>{t.updated}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      <td className="adm-wrap checklist-content-cell">
                        {row.content}
                      </td>
                      <td>
                        <StatusBadge
                          tone={row.isActive ? 'success' : 'neutral'}
                        >
                          {row.isActive ? t.active : t.inactive}
                        </StatusBadge>
                      </td>
                      <td className="adm-cell-mono">
                        {formatVnd(row.basePrice ?? 0)}
                        <br />
                        {row.includedImageCount ?? 0} {t.imagesShort} ·{' '}
                        {row.includedVideoCount ?? 0} {t.videosShort}
                        {row.pricingProfile ? ` · ${row.pricingProfile}` : ''}
                      </td>
                      <td>
                        <button
                          className="odm-btn odm-btn-gh odm-btn-sm"
                          onClick={() => setUsageId(row.id)}
                        >
                          {t.usedBy(
                            row.usedByServiceCount ?? 0,
                            row.usedByOrderCount ?? 0,
                          )}
                        </button>
                      </td>
                      <td className="adm-cell-mono">
                        {new Date(
                          row.updatedAt ?? row.createdAt,
                        ).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                      </td>
                      <td>
                        <div className="checklist-actions">
                          <button
                            className="odm-btn odm-btn-gh odm-btn-sm"
                            disabled={busy}
                            onClick={() => setEditor(row)}
                          >
                            <Icon
                              name="edit"
                              width={15}
                              height={15}
                              aria-hidden="true"
                            />
                            {t.edit}
                          </button>{' '}
                          <button
                            className={
                              'odm-btn odm-btn-gh odm-btn-sm' +
                              (row.isActive ? ' checklist-danger' : '')
                            }
                            disabled={busy}
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
            {!query.data.items.length && <EmptyState title={t.empty} />}
            <ChecklistPagination
              page={page}
              totalPages={query.data.totalPages}
              first={query.data.first}
              last={query.data.last}
              change={setPage}
            />
          </>
        )}
      </Card>
      <p className="checklist-banner">{t.future}</p>
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

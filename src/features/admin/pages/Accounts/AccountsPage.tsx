import { useEffect, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import {
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../api/adminUsersApi'
import { EmptyState } from '../../../../shared/components/ui'
import { Button } from '../../../../shared/components/ui'
import { TableCard } from '../../../../shared/components/ui'
import { Icon } from '../../../../shared/components/Icon'
import { mapUserSummary } from '../../lib/accountMappers'
import { adminHref } from '../../routes'
import type { AdminAccountItem } from '../../types/accounts'
import { accountsPageMessages } from './AccountsPage.messages'
import { AccountsFilters } from './components/AccountsFilters'
import { AccountsTable } from './components/AccountsTable'
import { CreateUserModal } from './components/CreateUserModal'
import { EditUserModal } from './components/EditUserModal'
import { LockAccountDialog } from './components/LockAccountDialog'
import { Pager } from './components/Pager'
import {
  ACCOUNTS_PAGE_SIZE,
  buildListParams,
  type AccountsFilterState,
} from './listParams'
import './accounts.css'

type DialogState =
  | { type: 'edit'; account: AdminAccountItem }
  | { type: 'lock'; account: AdminAccountItem }
  | null

const NO_FILTERS: AccountsFilterState = { search: '', role: '', status: '' }

export function AccountsPage({ openCreate = false }: { openCreate?: boolean }) {
  const { t } = useI18n(accountsPageMessages)
  const [filters, setFilters] = useState(NO_FILTERS)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [creating, setCreating] = useState(openCreate)
  const [created, setCreated] = useState<ManagedAccountResponse | null>(null)

  useEffect(() => setCreating(openCreate), [openCreate])

  // Debounce free-text search so each keystroke does not hit the backend.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(filters.search)
      setPage(0)
    }, 300)
    return () => window.clearTimeout(id)
  }, [filters.search])

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminUsersApi
        .listUsers({
          ...buildListParams({ ...filters, search }, page),
          signal,
        })
        .then((res) => ({ ...res, items: res.items.map(mapUserSummary) })),
    [page, search, filters.role, filters.status],
  )

  function changeFilters(next: AccountsFilterState) {
    if (next.role !== filters.role || next.status !== filters.status) setPage(0)
    setFilters(next)
  }

  function clearFilters() {
    setFilters(NO_FILTERS)
    setSearch('')
    setPage(0)
  }

  const filtered = Boolean(
    filters.search.trim() || filters.role || filters.status,
  )

  function closeCreate() {
    setCreating(false)
    if (openCreate) window.location.hash = adminHref({ screen: 'accounts' })
  }

  function handleDialogDone() {
    setDialog(null)
    reload()
  }

  return (
    <div className="accounts-page">
      <header className="accounts-header">
        <div className="accounts-header-content">
          <span className="accounts-header-icon" aria-hidden="true">
            <Icon name="users" width={28} height={28} />
          </span>
          <div>
            <h1>{t.title}</h1>
            <p>{t.description}</p>
          </div>
        </div>
        <div className="accounts-header-actions">
          <Button icon="activity" onClick={reload} disabled={loading}>
            {t.refresh}
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setCreating(true)}
          >
            {t.createUser}
          </Button>
        </div>
      </header>

      {created && (
        <div role="status" className="adm-alert is-success">
          <strong>{t.createdBanner}: </strong>
          {created.email}. {created.invitationSent ? t.invitationSent : ''}{' '}
          {created.passwordChangeRequired ? t.passwordChangeRequired : ''}
        </div>
      )}

      <section
        className="accounts-directory"
        aria-labelledby="accounts-directory-title"
      >
        <h2 id="accounts-directory-title" className="accounts-visually-hidden">
          {t.directoryTitle}
        </h2>
        <AccountsFilters
          value={filters}
          onChange={changeFilters}
          onClear={clearFilters}
        />
        <div
          className="accounts-results-summary"
          role="status"
          aria-live="polite"
        >
          <span>
            {loading
              ? t.loading
              : error !== undefined
                ? t.loadFailed
                : data
                  ? t.results(data.totalItems, filtered)
                  : ''}
          </span>
          {data && !loading && error === undefined && data.items.length > 0 && (
            <span>
              {t.range(
                data.page * ACCOUNTS_PAGE_SIZE + 1,
                data.page * ACCOUNTS_PAGE_SIZE + data.items.length,
              )}
            </span>
          )}
        </div>
        <div className="accounts-results" aria-busy={loading}>
          {loading && !data && <LoadingState />}
          {!loading && (error !== undefined || !data) && (
            <ErrorState error={error} onRetry={reload} />
          )}
          {data &&
            data.items.length === 0 &&
            !loading &&
            error === undefined && (
              <div className="accounts-empty">
                <Icon name="search" width={32} height={32} aria-hidden="true" />
                <EmptyState
                  title={t.emptyTitle}
                  description={
                    filtered ? t.emptyDescription : t.noAccountsDescription
                  }
                />
                {filtered && (
                  <button
                    type="button"
                    className="odm-btn"
                    onClick={clearFilters}
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
            )}
          {data && data.items.length > 0 && error === undefined && (
            <TableCard
              footer={
                <Pager
                  page={data.page}
                  totalPages={data.totalPages}
                  totalItems={data.totalItems}
                  onPage={setPage}
                  disabled={loading}
                />
              }
            >
              <AccountsTable
                items={data.items}
                onEdit={(account) => setDialog({ type: 'edit', account })}
                onLock={(account) => setDialog({ type: 'lock', account })}
              />
            </TableCard>
          )}
        </div>
      </section>

      {creating && (
        <CreateUserModal
          onClose={closeCreate}
          onCreated={(result) => {
            setCreated(result)
            closeCreate()
            setPage(0)
            reload()
          }}
        />
      )}
      {dialog?.type === 'edit' && (
        <EditUserModal
          userId={dialog.account.id}
          onClose={() => setDialog(null)}
          onChanged={reload}
        />
      )}
      {dialog?.type === 'lock' && (
        <LockAccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogDone}
        />
      )}
    </div>
  )
}

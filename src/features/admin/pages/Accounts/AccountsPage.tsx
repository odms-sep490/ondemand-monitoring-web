import { useEffect, useState } from 'react'

import { PlusOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import {
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../api/adminUsersApi'
import { mapUserSummary } from '../../lib/accountMappers'
import { fetchAccountStats } from '../../lib/accountStats'
import { adminHref } from '../../routes'
import type { AdminAccountItem } from '../../types/accounts'
import { accountsPageMessages } from './AccountsPage.messages'
import { AccountsFilters } from './components/AccountsFilters'
import { AccountsRoleTabs } from './components/AccountsRoleTabs'
import { AccountsTable } from './components/AccountsTable'
import { CreateUserModal } from './components/CreateUserModal'
import { EditUserModal } from './components/EditUserModal'
import { LockAccountDialog } from './components/LockAccountDialog'
import { ResetPasswordDialog } from './components/ResetPasswordDialog'
import {
  ACCOUNTS_PAGE_SIZE,
  buildListParams,
  type AccountsFilterState,
} from './listParams'

type DialogState =
  | { type: 'edit'; account: AdminAccountItem }
  | { type: 'lock'; account: AdminAccountItem }
  | { type: 'resetPwd'; account: AdminAccountItem }
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

  const stats = useApiQuery((signal) => fetchAccountStats(signal), [])
  const reloadAll = () => {
    reload()
    stats.reload()
  }

  function changeFilters(next: AccountsFilterState) {
    if (next.role !== filters.role || next.status !== filters.status) setPage(0)
    setFilters(next)
  }

  function closeCreate() {
    setCreating(false)
    if (openCreate) window.location.hash = adminHref({ screen: 'accounts' })
  }

  function handleDialogDone() {
    setDialog(null)
    reloadAll()
  }

  return (
    <div className="mgr-view">
      <PageHeader
        title={t.title}
        description={data ? `${data.totalItems} ${t.subtitle}` : undefined}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
            onClick={() => setCreating(true)}
          >
            {t.createUser}
          </Button>
        }
      />

      {created && (
        <Alert
          type="success"
          showIcon
          closable
          className="adm-alert"
          message={
            <>
              <strong>{t.createdBanner}: </strong>
              {created.email}. {created.invitationSent ? t.invitationSent : ''}{' '}
              {created.passwordChangeRequired ? t.passwordChangeRequired : ''}
            </>
          }
          onClose={() => setCreated(null)}
        />
      )}

      <AccountsRoleTabs
        value={filters.role}
        stats={stats.data}
        onChange={(role) => changeFilters({ ...filters, role })}
      />
      <AccountsFilters value={filters} onChange={changeFilters} />

      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && !loading && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {(loading && !data) || (data && data.items.length > 0) ? (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <AccountsTable
            items={data?.items ?? []}
            loading={loading}
            pagination={{
              current: (data?.page ?? 0) + 1,
              pageSize: ACCOUNTS_PAGE_SIZE,
              total: data?.totalItems ?? 0,
              onChange: (next) => setPage(next - 1),
            }}
            onEdit={(account) => setDialog({ type: 'edit', account })}
            onLock={(account) => setDialog({ type: 'lock', account })}
            onResetPassword={(account) =>
              setDialog({ type: 'resetPwd', account })
            }
          />
        </CardComponent>
      ) : null}

      {creating && (
        <CreateUserModal
          onClose={closeCreate}
          onCreated={(result) => {
            setCreated(result)
            closeCreate()
            setPage(0)
            reloadAll()
          }}
        />
      )}
      {dialog?.type === 'edit' && (
        <EditUserModal
          userId={dialog.account.id}
          onClose={() => setDialog(null)}
          onChanged={reloadAll}
        />
      )}
      {dialog?.type === 'lock' && (
        <LockAccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogDone}
        />
      )}
      {dialog?.type === 'resetPwd' && (
        <ResetPasswordDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

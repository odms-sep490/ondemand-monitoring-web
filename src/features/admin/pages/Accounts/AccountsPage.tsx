import { useEffect, useState } from 'react'

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
import { AdminLoading } from '../../components/common/AdminLoading'
import { mapUserSummary } from '../../lib/accountMappers'
import { adminHref } from '../../routes'
import type { AdminAccountItem } from '../../types/accounts'
import { accountsPageMessages } from './AccountsPage.messages'
import { AccountsFilters } from './components/AccountsFilters'
import { AccountsTable } from './components/AccountsTable'
import { CreateUserModal } from './components/CreateUserModal'
import { EditUserModal } from './components/EditUserModal'
import { LockAccountDialog } from './components/LockAccountDialog'
import { pagerMessages } from './components/Pager.messages'
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
  const { t: tp } = useI18n(pagerMessages)
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

  function closeCreate() {
    setCreating(false)
    if (openCreate) window.location.hash = adminHref({ screen: 'accounts' })
  }

  function handleDialogDone() {
    setDialog(null)
    reload()
  }

  return (
    <div className="mgr-view">
      <PageHeader
        title={t.title}
        description={data ? `${data.totalItems} ${t.subtitle}` : undefined}
        actions={
          <Button type="primary" onClick={() => setCreating(true)}>
            {t.createUser}
          </Button>
        }
      />

      {created && (
        <Alert
          type="success"
          showIcon
          role="status"
          message={
            <>
              <strong>{t.createdBanner}: </strong>
              {created.email}. {created.invitationSent ? t.invitationSent : ''}{' '}
              {created.passwordChangeRequired ? t.passwordChangeRequired : ''}
            </>
          }
        />
      )}

      <AccountsFilters value={filters} onChange={changeFilters} />

      {loading && !data && <AdminLoading />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && !loading && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.items.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <AccountsTable
            items={data.items}
            pagination={{
              current: data.page + 1,
              pageSize: ACCOUNTS_PAGE_SIZE,
              total: data.totalItems,
              showSizeChanger: false,
              hideOnSinglePage: false,
              position: ['bottomRight'],
              showTotal: (total) => `${tp.total}: ${total}`,
              locale: { prev_page: tp.prev, next_page: tp.next },
              onChange: (next) => setPage(next - 1),
            }}
            onEdit={(account) => setDialog({ type: 'edit', account })}
            onLock={(account) => setDialog({ type: 'lock', account })}
            onResetPassword={(account) => setDialog({ type: 'resetPwd', account })}
          />
          <div className="mgr-table-foot">
            {tp.page} {data.page + 1} {tp.of} {Math.max(data.totalPages, 1)}
          </div>
        </CardComponent>
      )}

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
      {dialog?.type === 'resetPwd' && (
        <ResetPasswordDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

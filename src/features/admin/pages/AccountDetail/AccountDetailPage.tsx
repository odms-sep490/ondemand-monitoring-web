import { useState } from 'react'

import { ErrorState } from '../../../../shared/components/antd'
import { AdminLoading } from '../../components/common/AdminLoading'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminUsersApi } from '../../api/adminUsersApi'
import { mapUserDetail } from '../../lib/accountMappers'
import { adminHref } from '../../routes'
import type { AdminAccountDetail } from '../../types/accounts'
import { EditUserModal } from '../Accounts'
import { accountDetailPageMessages } from './AccountDetailPage.messages'
import { AccountActionsCard } from './components/AccountActionsCard'
import { AccountHeader } from './components/AccountHeader'
import { AccountInfoCard } from './components/AccountInfoCard'

function setActive(id: string, active: boolean) {
  return adminUsersApi.updateUserStatus(id, { active }).then(mapUserDetail)
}

export function AccountDetailPage({ accountId }: { accountId: string }) {
  const { t } = useI18n(accountDetailPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.getUser(accountId, signal).then(mapUserDetail),
    [accountId],
  )

  const [account, setAccount] = useState<AdminAccountDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const display = account ?? data ?? null

  if (loading && !display) return <AdminLoading />
  if (!display) return <ErrorState error={error} onRetry={reload} />

  async function runAction(action: () => Promise<AdminAccountDetail>) {
    setActionLoading(true)
    setActionError(null)
    try {
      setAccount(await action())
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : t.genericError)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="mgr-view adm-narrow">
      {editing && (
        <EditUserModal
          userId={display.id}
          onClose={() => setEditing(false)}
          onChanged={() => {
            setAccount(null)
            reload()
          }}
        />
      )}

      <AccountHeader
        account={display}
        back={
          <a href={adminHref({ screen: 'accounts' })}>{t.backToAccounts}</a>
        }
        onEdit={() => setEditing(true)}
      />
      <AccountInfoCard account={display} />
      <AccountActionsCard
        inactive={display.status === 'INACTIVE'}
        loading={actionLoading}
        error={actionError}
        onDeactivate={() =>
          runAction(() => setActive(display.id, false))
        }
        onActivate={() => runAction(() => setActive(display.id, true))}
      />
    </div>
  )
}

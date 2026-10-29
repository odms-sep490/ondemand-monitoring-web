import { Button, Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminUsersApi, type ManagedUserRole } from '../../../api/adminUsersApi'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { rolesPageMessages } from '../RolesPage.messages'

/** One read-only role card with its live user count from the BE. */
export function RoleCard({ role }: { role: ManagedUserRole }) {
  const { t } = useI18n(rolesPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.listUsers({ role, size: 1, signal }),
    [role],
  )

  return (
    <CardComponent title={<RoleBadge role={role} />}>
      <p className="adm-role-desc">{t.descriptions[role]}</p>
      {loading ? (
        <span data-testid={`role-skeleton-${role}`} aria-busy="true">
          <Skeleton.Input active size="small" />
        </span>
      ) : error || !data ? (
        <div className="adm-row">
          <span className="mgr-cell-sub">{t.loadError}</span>
          <Button size="small" onClick={reload}>
            {t.retry}
          </Button>
        </div>
      ) : (
        <div>
          <span className="adm-role-count" data-testid={`role-count-${role}`}>
            {data.totalItems}
          </span>{' '}
          <span className="mgr-cell-sub">{t.users}</span>
        </div>
      )}
    </CardComponent>
  )
}

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminUsersApi, type ManagedUserRole } from '../../../api/adminUsersApi'
import { Button } from '../../../../../shared/components/ui'
import { Icon, type IconName } from '../../../../../shared/components/Icon'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
import { rolesPageMessages } from '../RolesPage.messages'

const ROLE_ICONS: Record<ManagedUserRole, IconName> = {
  ADMIN: 'shield',
  MANAGER: 'route',
  STAFF: 'radio',
  CUSTOMER: 'building',
}

/** One read-only role card with its live user count from the BE. */
export function RoleCard({ role }: { role: ManagedUserRole }) {
  const { t } = useI18n(rolesPageMessages)
  const { t: roleNames } = useI18n(roleBadgeMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.listUsers({ role, size: 1, signal }),
    [role],
  )

  return (
    <article
      className={`roles-card is-${role.toLowerCase()}`}
      aria-labelledby={`role-title-${role}`}
    >
      <div className="roles-card-body">
        <div className="roles-card-heading">
          <span className="roles-card-icon" aria-hidden="true">
            <Icon name={ROLE_ICONS[role]} width={20} height={20} />
          </span>
          <h3 id={`role-title-${role}`}>{roleNames.labels[role]}</h3>
          <span className="roles-code">{role}</span>
        </div>
        <p className="roles-description">{t.descriptions[role]}</p>
        <ul className="roles-responsibilities" aria-label={t.scope}>
          {t.responsibilities[role].map((item) => (
            <li key={item}>
              <Icon name="check" width={14} height={14} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="roles-card-footer" aria-live="polite" aria-busy={loading}>
        <span className="roles-count-label">
          <Icon name="users" width={16} height={16} aria-hidden="true" />
          {t.assignedAccounts}
        </span>
        {loading ? (
          <span
            className="roles-count-skeleton"
            data-testid={`role-skeleton-${role}`}
            aria-busy="true"
            aria-label={t.loading}
          />
        ) : error !== undefined || !data ? (
          <div className="roles-count-error">
            <span>{t.loadError}</span>
            <Button
              size="sm"
              onClick={reload}
              aria-label={t.retryRole(roleNames.labels[role])}
            >
              {t.retry}
            </Button>
          </div>
        ) : (
          <div className="roles-count">
            <strong data-testid={`role-count-${role}`}>
              {data.totalItems}
            </strong>
            <span>{t.users}</span>
          </div>
        )}
      </div>
    </article>
  )
}

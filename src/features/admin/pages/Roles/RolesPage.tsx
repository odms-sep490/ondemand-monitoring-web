import { useI18n } from '../../../../shared/i18n'
import { BE_USER_ROLES } from '../../api/adminUsersApi'
import { Button } from '../../../../shared/components/ui'
import { Icon } from '../../../../shared/components/Icon'
import { adminHref } from '../../routes'
import { rolesPageMessages } from './RolesPage.messages'
import { RoleCard } from './components/RoleCard'
import './roles.css'

export function RolesPage() {
  const { t } = useI18n(rolesPageMessages)
  return (
    <div className="roles-page">
      <header className="roles-header">
        <div className="roles-header-content">
          <span className="roles-header-icon" aria-hidden="true">
            <Icon name="shield" width={28} height={28} />
          </span>
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <Button href={adminHref({ screen: 'accounts' })} icon="users">
          {t.manageUsers}
        </Button>
      </header>
      <div className="roles-section-heading">
        <h2>{t.overview}</h2>
        <span className="roles-system-label">
          <Icon name="lock" width={13} height={13} aria-hidden="true" />
          {t.systemRoles(BE_USER_ROLES.length)}
        </span>
      </div>
      <div className="roles-grid">
        {BE_USER_ROLES.map((role) => (
          <RoleCard key={role} role={role} />
        ))}
      </div>
    </div>
  )
}

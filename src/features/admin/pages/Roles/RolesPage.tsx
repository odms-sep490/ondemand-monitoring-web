import { PageHeader } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { BE_USER_ROLES } from '../../api/adminUsersApi'
import { rolesPageMessages } from './RolesPage.messages'
import { RoleCard } from './components/RoleCard'

export function RolesPage() {
  const { t } = useI18n(rolesPageMessages)
  return (
    <div className="mgr-view">
      <PageHeader title={t.title} description={t.subtitle} />
      <div className="adm-role-grid">
        {BE_USER_ROLES.map((role) => (
          <RoleCard key={role} role={role} />
        ))}
      </div>
    </div>
  )
}

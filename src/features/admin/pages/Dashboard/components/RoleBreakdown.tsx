import { Progress } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { BE_USER_ROLES } from '../../../api/adminUsersApi'
import { RoleBadge } from '../../../components/common/RoleBadge'
import type { AccountStats } from '../accountStats'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

export function RoleBreakdown({ stats }: { stats: AccountStats | null | undefined }) {
  const { t } = useI18n(adminDashboardPageMessages)
  return (
    <CardComponent title={t.byRole}>
      <div className="adm-bar-list">
        {BE_USER_ROLES.map((role) => {
          const count = stats?.byRole[role]
          const pct =
            stats && stats.total > 0 && count !== undefined
              ? Math.round((count / stats.total) * 100)
              : 0
          return (
            <div key={role}>
              <div className="adm-bar-head">
                <RoleBadge role={role} />
                <strong className="adm-mono" data-testid={`dash-role-${role}`}>
                  {count ?? ''}
                </strong>
              </div>
              <Progress percent={pct} showInfo={false} size="small" aria-hidden="true" />
            </div>
          )
        })}
      </div>
    </CardComponent>
  )
}

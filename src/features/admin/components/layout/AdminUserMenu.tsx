import { PortalUserMenu } from '../../../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../../../shared/i18n'
import { adminLayoutMessages } from '../../AdminLayout.messages'

export function AdminUserMenu() {
  const { t } = useI18n(adminLayoutMessages)
  return <PortalUserMenu fallbackName={t.admin} profileHref="#portal/admin/accounts" />
}

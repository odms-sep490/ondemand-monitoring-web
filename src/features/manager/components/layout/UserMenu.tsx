import { PortalUserMenu } from '../../../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../../../shared/i18n'
import { managerLayoutMessages } from '../../ManagerLayout.messages'

export function UserMenu() {
  const { t } = useI18n(managerLayoutMessages)
  return <PortalUserMenu fallbackName={t.manager} />
}

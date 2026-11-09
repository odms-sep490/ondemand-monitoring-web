import { PortalUserMenu } from '../../../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../../../shared/i18n'
import { customerLayoutMessages } from '../../CustomerLayout.messages'

export function CustomerUserMenu() {
  const { t } = useI18n(customerLayoutMessages)
  return <PortalUserMenu fallbackName={t.customer} />
}

import { PortalUserMenu } from '../../../../shared/components/portal/PortalUserMenu'
import { useI18n } from '../../../../shared/i18n'
import { systemOperatorLayoutMessages } from '../../SystemOperatorLayout.messages'

export function SystemOperatorUserMenu() {
  const { t } = useI18n(systemOperatorLayoutMessages)
  return <PortalUserMenu fallbackName={t.userFallback} />
}

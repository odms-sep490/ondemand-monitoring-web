import { Alert, Button } from 'antd'

import { formatVn } from '../missionListHelpers'
import { operatorHref } from '../../../routes'
import { missionListPageMessages } from '../MissionListPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OperatorProfile } from '../../../types/mission'
import type { OperatorKpis } from '../../../lib/computeKpis'

export function CertExpiryBanner({
  profile,
  kpis,
}: {
  profile: OperatorProfile
  kpis: OperatorKpis
}) {
  const { t } = useI18n(missionListPageMessages)
  return (
    <Alert
      type="warning"
      showIcon
      message={
        <strong>
          {t.certExpiring(formatVn(profile.certExpiry), kpis.certDaysLeft)}
        </strong>
      }
      description={t.certExpiringHint}
      action={
        <Button size="small" href={operatorHref({ screen: 'profile' })}>
          {t.viewProfile}
        </Button>
      }
    />
  )
}

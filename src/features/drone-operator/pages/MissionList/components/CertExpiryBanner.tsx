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
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--yellow-bg)',
          color: 'var(--yellow-fg)',
          border: '1px solid var(--yellow-dot)',
        }}
      >
        <div style={{ flex: 1 }}>
          <strong>
            {t.certExpiring(formatVn(profile.certExpiry), kpis.certDaysLeft)}
          </strong>{' '}
          <span>{t.certExpiringHint}</span>
        </div>
        <a
          className="odm-btn odm-btn-sm"
          href={operatorHref({ screen: 'profile' })}
        >
          {t.viewProfile}
        </a>
      </div>
    </div>
  )
}

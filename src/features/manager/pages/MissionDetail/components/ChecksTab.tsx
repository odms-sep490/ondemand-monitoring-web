import { DetailSection } from '../../../components/common/DetailSection'
import {
  checkLabel,
  formatNumber,
  formatDateTime,
} from '../../../components/common/missionDetailHelpers'
import { MetricTile } from '../../../components/common/MetricTile'
import { CheckItemsList } from '../../../components/common/CheckItemsList'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PersistedPreflightCheckResponse,
  PersistedPostDeviceCheckResponse,
} from '../../../types/missions'

export function ChecksTab({
  preflight,
  postcheck,
}: {
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  return (
    <>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.precheckCard}
            badge={preflight ? checkLabel(preflight.status) : undefined}
          >
            {preflight ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid">
                  <MetricTile
                    label={t.totalChecks}
                    value={preflight.totalChecks}
                  />
                  <MetricTile label={t.passed} value={preflight.passedChecks} />
                  <MetricTile label={t.failed} value={preflight.failedChecks} />
                  <MetricTile
                    label={t.progress}
                    value={formatNumber(preflight.progressPercent, '%')}
                  />
                </div>
                <CheckItemsList items={preflight.items} />
              </div>
            ) : (
              <div className="odm-or-empty">{t.noPrecheck}</div>
            )}
          </DetailSection>
        </div>
      </section>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.postcheckCard}
            badge={postcheck ? checkLabel(postcheck.status) : undefined}
          >
            {postcheck ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid">
                  <MetricTile label={t.device} value={postcheck.deviceCode} />
                  <MetricTile
                    label={t.batteryLeft}
                    value={formatNumber(postcheck.landingBatteryPercent, '%')}
                  />
                  <MetricTile
                    label={t.batteryState}
                    value={postcheck.landingBatteryState}
                  />
                  <MetricTile
                    label={t.checkedAt}
                    value={formatDateTime(postcheck.checkedAt, locale)}
                  />
                  <MetricTile label={t.passed} value={postcheck.passedChecks} />
                  <MetricTile label={t.failed} value={postcheck.failedChecks} />
                </div>
                <CheckItemsList items={postcheck.items} />
              </div>
            ) : (
              <div className="odm-or-empty">{t.noPostcheck}</div>
            )}
          </DetailSection>
        </div>
      </section>
    </>
  )
}

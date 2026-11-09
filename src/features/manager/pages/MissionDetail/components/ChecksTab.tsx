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
import type { MissionStatus } from '../../../../../shared/types/domain'

export function ChecksTab({
  preflight,
  postcheck,
  missionStatus,
}: {
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
  missionStatus: MissionStatus
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const batteryState = postcheck?.landingBatteryState?.trim()
  const batteryStateLabel = batteryState
    ? (t.batteryStates[
        batteryState.toLowerCase() as keyof typeof t.batteryStates
      ] ?? batteryState)
    : '—'
  const preflightHasStarted = [
    'CONNECTED',
    'PREFLIGHT_CHECKING',
    'READY_TO_FLY',
    'IN_PROGRESS',
    'IN_FLIGHT',
    'RETURNING',
    'POSTFLIGHT_CHECKING',
    'AWAITING_REVIEW',
    'PENDING_REVIEW',
    'PENDING_APPROVAL',
    'COMPLETED',
    'FAILED_PREFLIGHT',
  ].includes(missionStatus)
  const postflightIsDue = [
    'IN_PROGRESS',
    'IN_FLIGHT',
    'RETURNING',
    'POSTFLIGHT_CHECKING',
    'AWAITING_REVIEW',
    'PENDING_REVIEW',
    'PENDING_APPROVAL',
    'COMPLETED',
    'FAILED',
  ].includes(missionStatus)
  return (
    <section className="odm-or-card mgr-md-checks">
      <div className="odm-or-card-body mgr-md-checks-grid">
        <div className="mgr-md-check-column">
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
              <div className="odm-or-empty" role="status">
                {preflightHasStarted ? t.precheckMissing : t.precheckNotStarted}
              </div>
            )}
          </DetailSection>
        </div>
        <div className="mgr-md-check-column">
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
                    value={batteryStateLabel}
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
              <div className="odm-or-empty" role="status">
                {postflightIsDue ? t.postcheckMissing : t.postcheckNotDue}
              </div>
            )}
          </DetailSection>
        </div>
      </div>
    </section>
  )
}

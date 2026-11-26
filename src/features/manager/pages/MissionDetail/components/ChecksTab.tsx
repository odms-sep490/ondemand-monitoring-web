import { DetailSection } from '../../../components/common/DetailSection'
import {
  checkLabel,
  checkTone,
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
            badgeTone={preflight ? checkTone(preflight.status) : undefined}
          >
            {preflight ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid mgr-check-compact-metrics">
                  <MetricTile
                    label={t.totalChecks}
                    value={preflight.totalChecks}
                  />
                  <MetricTile
                    label={t.passed}
                    value={preflight.passedChecks}
                    tone={preflight.passedChecks > 0 ? 'positive' : 'muted'}
                  />
                  <MetricTile
                    label={t.failed}
                    value={preflight.failedChecks}
                    tone={preflight.failedChecks > 0 ? 'danger' : 'muted'}
                  />
                  <MetricTile
                    label={t.progress}
                    value={formatNumber(preflight.progressPercent, '%')}
                    tone={preflight.progressPercent >= 100 && preflight.failedChecks === 0 ? 'positive' : undefined}
                  />
                </div>
                <div className="mgr-check-progress-track" aria-hidden="true">
                  <span
                    className={`mgr-check-progress-fill${preflight.failedChecks > 0 ? ' is-danger' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(0, preflight.progressPercent ?? 0))}%` }}
                  />
                </div>
                <div className="mgr-check-times">
                  <MetricTile label={t.checkStartedAt} value={formatDateTime(preflight.startedAt, locale)} />
                  <MetricTile label={t.checkCompletedAt} value={formatDateTime(preflight.completedAt, locale)} />
                </div>
                <details className="mgr-check-items-disclosure" key={preflight.id} open={preflight.failedChecks > 0}>
                  <summary>{t.checkItemsDetails(preflight.items.length)}</summary>
                  <CheckItemsList items={preflight.items} showCheckedAt />
                </details>
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
            badgeTone={postcheck ? checkTone(postcheck.status) : undefined}
          >
            {postcheck ? (
              <div className="odm-or-detail-stack">
                <div className="odm-or-detail-grid mgr-check-compact-metrics">
                  <MetricTile label={t.totalChecks} value={postcheck.totalChecks} />
                  <MetricTile
                    label={t.passed}
                    value={postcheck.passedChecks}
                    tone={postcheck.passedChecks > 0 ? 'positive' : 'muted'}
                  />
                  <MetricTile
                    label={t.failed}
                    value={postcheck.failedChecks}
                    tone={postcheck.failedChecks > 0 ? 'danger' : 'muted'}
                  />
                  <MetricTile
                    label={t.progress}
                    value={formatNumber(postcheck.progressPercent, '%')}
                    tone={postcheck.progressPercent >= 100 && postcheck.failedChecks === 0 ? 'positive' : undefined}
                  />
                </div>
                <div className="mgr-check-progress-track" aria-hidden="true">
                  <span
                    className={`mgr-check-progress-fill${postcheck.failedChecks > 0 ? ' is-danger' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(0, postcheck.progressPercent ?? 0))}%` }}
                  />
                </div>
                <div className="mgr-check-times">
                  <MetricTile label={t.checkStartedAt} value={formatDateTime(postcheck.startedAt, locale)} />
                  <MetricTile label={t.checkCompletedAt} value={formatDateTime(postcheck.completedAt, locale)} />
                </div>
                <details className="mgr-check-items-disclosure" key={postcheck.id} open={postcheck.failedChecks > 0}>
                  <summary>{t.checkItemsDetails(postcheck.items.length)}</summary>
                  <CheckItemsList items={postcheck.items} showCheckedAt />
                </details>
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

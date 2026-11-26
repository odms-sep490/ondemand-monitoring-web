import { ALL_KEYS } from '../postflightHelpers'
import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'
import type { PostflightSummary } from '../../../lib/postflightSummary'

export function AssessmentProgress({
  failItems,
  summary,
  allAssessed,
  handlePassAll,
  total = ALL_KEYS.length,
}: {
  failItems: PostflightItemKey[]
  summary: PostflightSummary
  allAssessed: boolean
  handlePassAll: () => void
  total?: number
}) {
  const { t } = useI18n(postflightPageMessages)
  const assessedCount = summary.nOk + failItems.length
  const pct = total > 0 ? Math.min(100, Math.round((assessedCount / total) * 100)) : 0
  return (
    <div className={`postflight-progress${failItems.length ? ' has-failures' : ''}`}>
      <div className="postflight-progress-copy">
        <div className="postflight-progress-label">
          {t.assessmentProgress}
        </div>
        <div className="postflight-progress-count">
          <span>
            {t.itemsAssessed(assessedCount, total)}
          </span>
          {allAssessed && (
            <span
              className={`postflight-progress-badge${failItems.length ? ' is-fail' : ''}`}
            >
              {failItems.length > 0
                ? t.someFailed(failItems.length)
                : t.allPassed}
            </span>
          )}
        </div>
        <div className="postflight-progress-track" aria-hidden="true">
          <span
            className={`postflight-progress-fill${failItems.length ? ' is-fail' : allAssessed ? ' is-pass' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        className="postflight-pass-all"
        onClick={handlePassAll}
      >
        {t.passAll}
      </button>
    </div>
  )
}

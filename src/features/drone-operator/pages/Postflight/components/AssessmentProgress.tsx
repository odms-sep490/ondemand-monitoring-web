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
}: {
  failItems: PostflightItemKey[]
  summary: PostflightSummary
  allAssessed: boolean
  handlePassAll: () => void
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className={`postflight-progress${failItems.length ? ' has-failures' : ''}`}>
      <div className="postflight-progress-copy">
        <div className="postflight-progress-label">
          {t.assessmentProgress}
        </div>
        <div className="postflight-progress-count">
          <span>
            {t.itemsAssessed(summary.nOk + failItems.length, ALL_KEYS.length)}
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

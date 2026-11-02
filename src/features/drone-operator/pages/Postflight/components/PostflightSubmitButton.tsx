import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'

export function PostflightSubmitButton({
  saving,
  allAssessed,
  handleComplete,
  failItems,
}: {
  saving: boolean
  allAssessed: boolean
  handleComplete: () => Promise<void>
  failItems: PostflightItemKey[]
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className="postflight-submit">
      <button
        type="button"
        className={`postflight-complete-button${failItems.length > 0 ? ' has-failures' : ''}`}
        disabled={saving || !allAssessed}
        onClick={handleComplete}
      >
        {saving
          ? t.submitting
          : failItems.length > 0
            ? t.submitAndCreateTicket
            : t.completeFlight}
      </button>
    </div>
  )
}

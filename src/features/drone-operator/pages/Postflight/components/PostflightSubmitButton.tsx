import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'
import { postflightPageMessages } from '../PostflightPage.messages'

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
    <div className="stf-row" style={{ justifyContent: 'flex-end' }}>
      <Button
        type="primary"
        size="large"
        danger={failItems.length > 0}
        disabled={saving || !allAssessed}
        loading={saving}
        onClick={handleComplete}
      >
        {saving
          ? t.submitting
          : failItems.length > 0
            ? t.submitAndCreateTicket
            : t.completeFlight}
      </Button>
    </div>
  )
}

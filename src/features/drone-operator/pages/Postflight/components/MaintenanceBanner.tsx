import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'
import type { Dispatch, SetStateAction } from 'react'

export function MaintenanceBanner({
  failItems,
  deviceLabel,
  setShowTicketDialog,
  ticketCreated,
}: {
  failItems: PostflightItemKey[]
  deviceLabel: string
  setShowTicketDialog: Dispatch<SetStateAction<boolean>>
  ticketCreated: boolean
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className="postflight-maintenance-banner">
      <div className="postflight-maintenance-copy">
        <div className="postflight-maintenance-title">
          {t.foundFailures(failItems.length)}
        </div>
        <div className="postflight-maintenance-description">
          {t.autoTicketNotePrefix} <b>{t.autoTicketNoteBold}</b>{' '}
          {t.autoTicketNoteMid} <b>{deviceLabel}</b> {t.autoTicketNoteSuffix}
        </div>
      </div>

      <button
        type="button"
        className="postflight-maintenance-button"
        onClick={() => setShowTicketDialog(true)}
      >
        {ticketCreated ? t.detailsAdded : t.addMaintenanceDetails}
      </button>
    </div>
  )
}

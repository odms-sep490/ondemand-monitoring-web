import { Alert, Button } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'
import { postflightPageMessages } from '../PostflightPage.messages'

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
    <Alert
      type="warning"
      showIcon
      message={<strong>{t.foundFailures(failItems.length)}</strong>}
      description={
        <>
          {t.autoTicketNotePrefix} <b>{t.autoTicketNoteBold}</b>{' '}
          {t.autoTicketNoteMid} <b>{deviceLabel}</b> {t.autoTicketNoteSuffix}
        </>
      }
      action={
        <Button type="primary" onClick={() => setShowTicketDialog(true)}>
          {ticketCreated ? t.detailsAdded : t.addMaintenanceDetails}
        </Button>
      }
    />
  )
}

import { Alert } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { postflightPageMessages } from '../PostflightPage.messages'

export function TicketCreatedBanner() {
  const { t } = useI18n(postflightPageMessages)
  return (
    <Alert
      type="success"
      showIcon
      message={
        <>
          {t.allPassNotePrefix} <b>{t.allPassNoteBold}</b> {t.allPassNoteSuffix}
        </>
      }
    />
  )
}

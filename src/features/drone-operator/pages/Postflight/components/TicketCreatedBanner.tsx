import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function TicketCreatedBanner() {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className="postflight-success-banner" role="status">
      <span className="postflight-success-dot" aria-hidden="true" />
      {t.allPassNotePrefix} <b>{t.allPassNoteBold}</b> {t.allPassNoteSuffix}
    </div>
  )
}

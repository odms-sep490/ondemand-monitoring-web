import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function TicketCreatedBanner() {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1.5px solid #10b981',
        fontSize: 13.5,
        color: '#065f46',
        fontWeight: 600,
      }}
    >
      {t.allPassNotePrefix} <b>{t.allPassNoteBold}</b> {t.allPassNoteSuffix}
    </div>
  )
}

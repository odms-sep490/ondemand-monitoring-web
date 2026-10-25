import { handoverPageMessages } from '../HandoverPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function AckToggle({ ack }: { ack: boolean }) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: ack ? 'none' : '3px solid var(--bd2)',
          background: ack ? 'var(--green-solid)' : 'transparent',
          color: 'var(--green-on)',
        }}
      >
        {ack ? '✓' : null}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{t.ackLabel}</span>
    </>
  )
}

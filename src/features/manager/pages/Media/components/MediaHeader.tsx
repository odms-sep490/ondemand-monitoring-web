import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MediaHeader({
  manualCount,
  badCount,
  waitCount,
}: {
  manualCount: number
  badCount: number
  waitCount: number
}) {
  const { t } = useI18n(mediaPageMessages)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
            lineHeight: 1.25,
          }}
        >
          {t.pageTitle}
        </h1>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
          {t.summary(manualCount, badCount, waitCount)}
        </div>
      </div>
    </div>
  )
}

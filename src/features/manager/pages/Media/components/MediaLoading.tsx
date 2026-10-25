import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MediaLoading() {
  const { t } = useI18n(mediaPageMessages)
  return (
    <div>
      <h1
        style={{
          margin: '0 0 16px',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-.01em',
        }}
      >
        {t.pageTitle}
      </h1>
      <div className="odm-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="odm-sk"
              style={{ width: '100%', height: 44 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

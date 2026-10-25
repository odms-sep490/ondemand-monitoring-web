import { reportsPageMessages } from '../ReportsPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function ReportsSkeleton() {
  const { t } = useI18n(reportsPageMessages)
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="odm-sk"
            style={{ width: '100%', height: 70, borderRadius: 8 }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div
          className="odm-sk"
          style={{ width: '100%', height: 290, borderRadius: 8 }}
        />
        <div
          className="odm-sk"
          style={{ width: '100%', height: 290, borderRadius: 8 }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 14,
          marginTop: 14,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="odm-sk"
            style={{ width: '100%', height: 270, borderRadius: 8 }}
          />
        ))}
      </div>
    </div>
  )
}

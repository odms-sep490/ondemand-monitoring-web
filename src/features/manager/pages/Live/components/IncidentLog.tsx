import { livePageMessages } from '../LivePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LiveTelemetry } from '../../../types/missions'

export function IncidentLog({ telemetry }: { telemetry: LiveTelemetry }) {
  const { t, locale } = useI18n(livePageMessages)
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
        {t.incidentLog(telemetry.activeIncidents.length)}
      </div>
      <div
        style={{
          border: '1px solid var(--bd)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {telemetry.activeIncidents.map((inc, i) => (
          <div
            key={inc.id}
            style={{
              padding: '10px 14px',
              borderBottom:
                i < telemetry.activeIncidents.length - 1
                  ? '1px solid var(--bd)'
                  : 'none',
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--orange-fg)',
                  background: 'var(--orange-bg)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                {inc.type}
              </span>
              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
                {new Date(inc.reportedAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div style={{ color: 'var(--tx2)' }}>{inc.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

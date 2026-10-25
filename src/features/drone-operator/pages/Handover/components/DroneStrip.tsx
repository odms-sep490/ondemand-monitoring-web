import { useI18n } from '../../../../../shared/i18n'
import { handoverPageMessages } from '../HandoverPage.messages'

export function DroneStrip({
  missionLabel,
  droneLabel,
}: {
  missionLabel: string
  droneLabel: string
}) {
  const { t } = useI18n(handoverPageMessages)
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 12,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'var(--sf3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        🔗
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {droneLabel} · {missionLabel}
        </div>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
          {t.connectedAt}
        </div>
      </div>
      <span className="odm-badge odm-badge-green odm-badge-lg">
        <span className="odm-badge-dot" aria-hidden="true" />
        {t.connected}
      </span>
    </div>
  )
}

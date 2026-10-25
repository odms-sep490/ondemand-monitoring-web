import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { GeofenceStatus } from '../inFlightTypes'

export function GeofenceBanner({
  geofenceTone,
  geofenceStatus,
  geofenceMessage,
}: {
  geofenceTone: string
  geofenceStatus: GeofenceStatus
  geofenceMessage: string
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <GlassPanel
      style={{
        position: 'absolute',
        left: '50%',
        top: 20,
        transform: 'translateX(-50%)',
        width: 'min(460px, calc(100% - 56px))',
        padding: '13px 16px',
        border:
          geofenceTone === 'danger'
            ? '1px solid rgba(248,113,113,.72)'
            : '1px solid rgba(251,191,36,.72)',
        background:
          geofenceTone === 'danger'
            ? 'rgba(127,29,29,.78)'
            : 'rgba(120,53,15,.82)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="alert" size={22} />
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 950,
              color: geofenceTone === 'danger' ? '#fee2e2' : '#fef3c7',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            {geofenceStatus.level === 'VIOLATION'
              ? t.geofence.breachTitle
              : t.geofence.warningTitle}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              color: geofenceTone === 'danger' ? '#fecaca' : '#fde68a',
              fontWeight: 750,
            }}
          >
            {geofenceMessage}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}

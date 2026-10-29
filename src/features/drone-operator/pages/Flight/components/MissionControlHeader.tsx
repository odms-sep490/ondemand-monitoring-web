import { Icon } from './Icon'
import { MissionProgress } from './MissionProgress'
import { fmt } from '../inFlightFormat'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Drone } from '../../../types/omss'

export function MissionControlHeader({
  drone,
  isOnline,
  progress,
  elapsed,
  remaining,
}: {
  drone: Drone
  isOnline: boolean
  progress: number
  elapsed: number
  remaining: number
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: '330px minmax(320px,1fr) 280px',
        alignItems: 'center',
        gap: 22,
        padding: '12px 22px',
        background: 'linear-gradient(180deg,var(--fc-bg),var(--fc-bg))',
        borderBottom:
          '1px solid color-mix(in srgb, var(--fc-blue) 28%, transparent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: 'color-mix(in srgb, var(--fc-blue) 18%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--fc-blue) 30%, transparent)',
            color: 'var(--fc-blue)',
          }}
        >
          <Icon name="drone" size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <strong style={{ fontSize: 14, letterSpacing: '.02em' }}>
              {drone.name || drone.id}
            </strong>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 999,
                background:
                  'color-mix(in srgb, var(--fc-green) 18%, transparent)',
                color: 'var(--fc-green)',
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              <span
                className={isOnline ? 'pulse-dot' : undefined}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isOnline
                    ? 'var(--fc-green-solid)'
                    : 'var(--fc-red-solid)',
                }}
              />
              {isOnline ? t.header.live : t.header.offline}
            </span>
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--fc-tx2)' }}>
            {t.header.droneOperator}
          </div>
        </div>
      </div>

      <MissionProgress progress={progress} />

      <div
        style={{
          justifySelf: 'end',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-data)',
            color: 'var(--fc-tx2)',
          }}
        >
          {fmt(elapsed)} / {fmt(remaining)}
        </span>
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border:
              '1px solid color-mix(in srgb, var(--fc-tx2) 20%, transparent)',
            background: 'color-mix(in srgb, var(--fc-panel) 76%, transparent)',
            color: 'var(--fc-tx)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
          title={t.header.settings}
        >
          <Icon name="settings" size={18} />
        </button>
      </div>
    </header>
  )
}

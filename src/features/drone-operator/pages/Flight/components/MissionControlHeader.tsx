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
        background: 'linear-gradient(180deg,#071324,#08111f)',
        borderBottom: '1px solid rgba(59,130,246,.28)',
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
            background: 'rgba(37,99,235,.18)',
            border: '1px solid rgba(96,165,250,.3)',
            color: '#93c5fd',
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
                background: 'rgba(22,163,74,.18)',
                color: '#4ade80',
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
                  background: isOnline ? '#22c55e' : '#ef4444',
                }}
              />
              {isOnline ? t.header.live : t.header.offline}
            </span>
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: '#94a3b8' }}>
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
            color: '#94a3b8',
          }}
        >
          {fmt(elapsed)} / {fmt(remaining)}
        </span>
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,.2)',
            background: 'rgba(15,23,42,.76)',
            color: '#cbd5e1',
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

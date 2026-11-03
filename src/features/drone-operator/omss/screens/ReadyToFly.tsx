import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { readyToFlyMessages } from '../i18n/readyToFly'
import type { Mission, Drone } from '../../types/omss'

interface Props {
  mission: Mission
  drone: Drone
  canStartMission?: boolean
  onStart: () => void
  onAbort: () => void
}

export default function ReadyToFly({
  mission,
  drone,
  canStartMission = false,
  onStart,
  onAbort,
}: Props) {
  const { t } = useI18n(readyToFlyMessages)
  const [confirmed, setConfirmed] = useState(false)
  const canStart = confirmed && canStartMission

  const CHECKS = [
    { key: 'missionAccepted', label: t.checks.missionAccepted, ok: true },
    { key: 'droneConnected', label: t.checks.droneConnected, ok: true },
    { key: 'preflightPassed', label: t.checks.preflightPassed, ok: true },
    { key: 'handoverCompleted', label: t.checks.handoverCompleted, ok: true },
  ]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 520 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          {t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          {canStartMission ? t.description : t.waitingForInspector}
        </p>

        {/* Readiness card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--green-border)',
            borderRadius: 10,
            padding: '22px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--green)',
              }}
              className="pulse-dot"
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--green-text)',
              }}
            >
              {t.readyToFly}
            </span>
          </div>
          {CHECKS.map((c) => (
            <div
              key={c.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: c.ok ? 'var(--green)' : 'var(--red)',
                }}
              >
                {c.ok ? '✓' : '✕'}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: c.ok ? 'var(--text)' : 'var(--red-text)',
                  fontWeight: c.ok ? 400 : 500,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}

        </div>

        {/* Mission summary */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          {[
            [t.fields.mission, mission.id, true],
            [t.fields.drone, drone.name || drone.id, true],
            [t.fields.location, mission.location, false],
            [t.fields.battery, `${drone.battery}%`, false],
          ].map(([l, v, isData]) => (
            <div
              key={l as string}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  fontFamily: isData ? 'var(--font-data)' : undefined,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {canStartMission && (
          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 16,
              padding: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span
              style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}
            >
              {t.confirmLabel}
            </span>
          </label>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onAbort}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-2)',
              background: 'var(--surface)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            {t.abort}
          </button>
          {canStartMission && (
            <button
              onClick={onStart}
              disabled={!canStart}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: canStart ? 'var(--accent)' : 'var(--surface-2)',
                fontSize: 14,
                fontWeight: 700,
                color: canStart ? '#fff' : 'var(--text-3)',
                cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              {t.startMission}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

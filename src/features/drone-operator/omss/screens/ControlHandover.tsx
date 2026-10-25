import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { controlHandoverMessages } from '../i18n/controlHandover'
import type { Mission, Drone } from '../../types/omss'

interface Props {
  mission: Mission
  drone: Drone
  onComplete: () => void
  onBack: () => void
}
type Phase = 'request' | 'awaiting' | 'approved'

export default function ControlHandover({
  mission,
  drone,
  onComplete,
  onBack,
}: Props) {
  const { t, locale } = useI18n(controlHandoverMessages)
  const [phase, setPhase] = useState<Phase>('request')
  const [code, setCode] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  function request() {
    setPhase('awaiting')
    setTimeout(() => setPhase('approved'), 3000)
  }

  const steps = [
    {
      key: 'submitRequest',
      label: t.steps.submitRequest,
      done: phase !== 'request',
    },
    {
      key: 'managerApproves',
      label: t.steps.managerApproves,
      done: phase === 'approved',
    },
    { key: 'enterAuthCode', label: t.steps.enterAuthCode, done: false },
  ]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--text-2)',
          fontSize: 13,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 20,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 2L4 7l5 5" />
        </svg>
        {t.preflightCheck}
      </button>

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
          {t.description}
        </p>

        {/* Step tracker */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: i < steps.length - 1 ? 1 : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: s.done ? 'var(--green)' : 'var(--surface-2)',
                    border: `1.5px solid ${s.done ? 'var(--green)' : 'var(--border-2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.done ? '#fff' : 'var(--text-3)',
                  }}
                >
                  {s.done ? '✓' : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: s.done ? 'var(--green-text)' : 'var(--text-3)',
                    textAlign: 'center',
                    maxWidth: 80,
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: steps[i].done
                      ? 'var(--green)'
                      : 'var(--border)',
                    margin: '0 8px',
                    marginBottom: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mission card */}
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
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            {[
              [t.fields.mission, mission.id, true],
              [t.fields.drone, drone.name || drone.id, true],
              [t.fields.operator, 'J. Martinez (OPR-112)', false],
              [
                t.fields.scheduled,
                new Date(mission.scheduledAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) + ' UTC',
                false,
              ],
            ].map(([l, v, isData]) => (
              <div key={l as string}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-3)',
                    marginBottom: 2,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                    fontFamily: isData ? 'var(--font-data)' : undefined,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {phase === 'request' && (
          <button
            onClick={request}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            {t.requestHandover}
          </button>
        )}

        {phase === 'awaiting' && (
          <div
            style={{
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)',
              borderRadius: 10,
              padding: '20px',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--blue-border)',
                borderTopColor: 'var(--blue)',
                borderRadius: '50%',
                margin: '0 auto 12px',
              }}
              className="spin"
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--blue-text)',
              }}
            >
              {t.awaitingApproval}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--blue-text)',
                opacity: 0.8,
                marginTop: 4,
              }}
            >
              {t.notificationSent}
            </div>
          </div>
        )}

        {phase === 'approved' && (
          <>
            <div
              style={{
                background: 'var(--green-bg)',
                border: '1px solid var(--green-border)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 16, color: 'var(--green)' }}>✓</span>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--green-text)',
                  }}
                >
                  {t.approvedByManager}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--green-text)',
                    opacity: 0.8,
                  }}
                >
                  {t.enterCodePrompt}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {t.authCodeLabel}
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t.authCodePlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 16,
                  fontFamily: 'var(--font-data)',
                  letterSpacing: '.2em',
                  textAlign: 'center',
                }}
                maxLength={6}
              />
            </div>

            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                cursor: 'pointer',
                marginBottom: 20,
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

            <button
              onClick={onComplete}
              disabled={code.length < 4 || !confirmed}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background:
                  code.length >= 4 && confirmed
                    ? 'var(--accent)'
                    : 'var(--surface-2)',
                fontSize: 14,
                fontWeight: 600,
                color: code.length >= 4 && confirmed ? '#fff' : 'var(--text-3)',
                cursor:
                  code.length >= 4 && confirmed ? 'pointer' : 'not-allowed',
              }}
            >
              {t.completeHandover}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

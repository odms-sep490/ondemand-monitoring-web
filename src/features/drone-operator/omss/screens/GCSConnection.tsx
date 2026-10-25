import { useState } from 'react'
import type { Mission, Drone } from '../../types/omss'
import { flightControlApi } from '../../api/flightControlApi'
import { useI18n } from '../../../../shared/i18n'
import { gcsConnectionMessages } from '../i18n/gcsConnection'

interface Props {
  mission: Mission
  drone: Drone
  onConnected: () => void | Promise<void>
  onBack: () => void
}

type Phase = 'idle' | 'discover' | 'handshake' | 'sync' | 'done' | 'fail'

interface LogEntry {
  t: string
  msg: string
  ok: boolean
}

export default function GCSConnection({
  mission,
  drone,
  onConnected,
  onBack,
}: Props) {
  const { t } = useI18n(gcsConnectionMessages)
  const STEPS = [
    { id: 'discover', ...t.steps.discover },
    { id: 'handshake', ...t.steps.handshake },
    { id: 'sync', ...t.steps.sync },
    { id: 'done', ...t.steps.done },
  ]
  const [phase, setPhase] = useState<Phase>('idle')
  const [log, setLog] = useState<LogEntry[]>([])

  function ts() {
    return new Date().toISOString().slice(11, 22)
  }
  function addLog(msg: string, ok = true) {
    setLog((prev) => [...prev, { t: ts(), msg, ok }])
  }

  async function start() {
    setPhase('discover')
    addLog(t.log.initiating)
    try {
      const status = await flightControlApi.status()
      if (!status.online) throw new Error(t.errors.offline)
      if (
        !status.connection?.grpcConnected ||
        !status.connection?.px4Connected
      ) {
        throw new Error(t.errors.mavsdkNotConnected)
      }
      addLog(t.log.controllerOnline(drone.name || drone.id))
      setPhase('handshake')
      const missionId = mission.backendId ?? mission.id
      let bound: Awaited<ReturnType<typeof flightControlApi.bindSession>>
      try {
        bound = await flightControlApi.bindSession(missionId, drone.id)
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : ''
        if (
          !message.includes(
            'Cannot switch control session while recording or in flight',
          )
        ) {
          throw cause
        }
        addLog(t.log.staleSession, false)
        await flightControlApi.releaseSession()
        bound = await flightControlApi.bindSession(missionId, drone.id)
      }
      addLog(t.log.sessionBound(bound.missionId))
      setPhase('sync')
      const verified = await flightControlApi.status()
      if (verified.missionId !== missionId || verified.deviceId !== drone.id) {
        throw new Error(t.errors.sessionVerificationFailed)
      }
      if (
        !verified.connection?.grpcConnected ||
        !verified.connection?.px4Connected
      ) {
        throw new Error(t.errors.mavsdkDisconnected)
      }
      addLog(t.log.statusVerified)
      setPhase('done')
      addLog(t.log.linkReady)
    } catch (cause) {
      setPhase('fail')
      addLog(
        cause instanceof Error ? cause.message : t.errors.genericFailed,
        false,
      )
    }
  }

  const stepsDone = {
    idle: 0,
    discover: 0,
    handshake: 1,
    sync: 2,
    done: 4,
    fail: 0,
  }[phase]

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
        {t.missionDetail}
      </button>

      <div style={{ maxWidth: 560 }}>
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
          {t.connectingTo} <strong>{drone.name || drone.id}</strong>{' '}
          {t.forMission} <strong>{mission.id}</strong>.
        </p>

        {/* Steps */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          {STEPS.map((step, i) => {
            const done = stepsDone > i
            const active =
              stepsDone === i && phase !== 'idle' && phase !== 'done'
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  marginBottom: i < STEPS.length - 1 ? 20 : 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: done
                        ? 'var(--green-bg)'
                        : active
                          ? 'var(--accent-bg)'
                          : 'var(--surface-2)',
                      border: `1.5px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border-2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <span
                        style={{
                          color: 'var(--green)',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    ) : active ? (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '2px solid var(--accent)',
                          borderTopColor: 'transparent',
                        }}
                        className="spin"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-3)',
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: done ? 'var(--green)' : 'var(--border)',
                        marginTop: 4,
                        minHeight: 16,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    paddingTop: 4,
                    paddingBottom: i < STEPS.length - 1 ? 16 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: done
                        ? 'var(--green-text)'
                        : active
                          ? 'var(--accent)'
                          : 'var(--text-2)',
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-3)',
                      marginTop: 2,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '14px',
              marginBottom: 20,
              maxHeight: 160,
              overflowY: 'auto',
            }}
          >
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 4,
                  fontSize: 12,
                  fontFamily: 'var(--font-data)',
                }}
              >
                <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                  {entry.t}
                </span>
                <span
                  style={{ color: entry.ok ? 'var(--text-2)' : 'var(--red)' }}
                >
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        )}

        {phase === 'idle' && (
          <button
            onClick={start}
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
            }}
          >
            {t.connectToDrone}
          </button>
        )}
        {(phase === 'discover' ||
          phase === 'handshake' ||
          phase === 'sync') && (
          <button
            disabled
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--surface-2)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-3)',
              cursor: 'not-allowed',
            }}
          >
            {t.connecting}
          </button>
        )}
        {phase === 'done' && (
          <button
            onClick={onConnected}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--green)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {mission.state === 'IN_FLIGHT'
              ? t.returnToMissionControl
              : t.continueToPreflight}
          </button>
        )}
        {phase === 'fail' && (
          <button
            onClick={() => void start()}
            style={{
              width: '100%',
              padding: 11,
              borderRadius: 8,
              border: 'none',
              background: 'var(--red)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {t.retryConnection}
          </button>
        )}
      </div>
    </div>
  )
}

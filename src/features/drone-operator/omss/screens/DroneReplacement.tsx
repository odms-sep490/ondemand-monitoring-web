import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../shared/types/domain'
import { droneReplacementMessages } from '../i18n/droneReplacement'
import type { Drone } from '../../types/omss'

interface Props {
  current: Drone
  replacements: Drone[]
  onSelect: (d: Drone) => void
  onBack: () => void
}

export default function DroneReplacement({
  current,
  replacements,
  onSelect,
  onBack,
}: Props) {
  const { t, lang } = useI18n(droneReplacementMessages)
  const [sel, setSel] = useState<string | null>(null)

  function BatBar({ pct }: { pct: number }) {
    const c =
      pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 5,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: c,
              borderRadius: 3,
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: c, minWidth: 32 }}>
          {pct}%
        </span>
      </div>
    )
  }

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
        {t.preflightFailure}
      </button>

      <div style={{ maxWidth: 640 }}>
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
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 10px' }}>
          {current.id} {t.description}
        </p>

        {/* Current drone */}
        <div
          style={{
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--red-text)',
              }}
            >
              {current.name} — {current.id}
            </div>
            <div
              style={{ fontSize: 12, color: 'var(--red-text)', opacity: 0.8 }}
            >
              {t.unavailable} · {t.state}:{' '}
              {getDroneStatusLabel(current.state as DroneStatus, lang)}
            </div>
          </div>
          <span
            style={{
              fontSize: 12,
              color: 'var(--red-text)',
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 6,
              padding: '3px 9px',
              fontWeight: 600,
            }}
          >
            {t.removed}
          </span>
        </div>

        {/* Replacement options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {replacements.map((d) => {
            const selected = sel === d.id
            const ready = d.battery >= 80 && d.gpsCount >= 8
            return (
              <button
                key={d.id}
                onClick={() => ready && setSel(d.id)}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  padding: '18px',
                  borderRadius: 10,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent-bg)' : 'var(--surface)',
                  boxShadow: 'var(--shadow)',
                  opacity: ready ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text)',
                      }}
                    >
                      {d.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--text-3)',
                        marginTop: 2,
                      }}
                    >
                      {d.id} · {d.model}
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {!ready && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--red-text)',
                          background: 'var(--red-bg)',
                          border: '1px solid var(--red-border)',
                          padding: '3px 8px',
                          borderRadius: 5,
                        }}
                      >
                        {t.notReady}
                      </span>
                    )}
                    {ready && !selected && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--green-text)',
                          background: 'var(--green-bg)',
                          border: '1px solid var(--green-border)',
                          padding: '3px 8px',
                          borderRadius: 5,
                        }}
                      >
                        {t.available}
                      </span>
                    )}
                    {selected && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#fff',
                          background: 'var(--accent)',
                          padding: '3px 8px',
                          borderRadius: 5,
                          fontWeight: 600,
                        }}
                      >
                        {t.selected}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginBottom: 5,
                      }}
                    >
                      {t.battery}
                    </div>
                    <BatBar pct={d.battery} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginBottom: 5,
                      }}
                    >
                      {t.gps}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: d.gpsCount >= 8 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {d.gpsCount} {t.sats}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginBottom: 5,
                      }}
                    >
                      {t.storage}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text)',
                      }}
                    >
                      {(d.storageMB / 1024).toFixed(1)} GB
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => {
            const d = replacements.find((x) => x.id === sel)
            if (d) onSelect(d)
          }}
          disabled={!sel}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 8,
            border: 'none',
            background: sel ? 'var(--accent)' : 'var(--surface-2)',
            fontSize: 14,
            fontWeight: 600,
            color: sel ? '#fff' : 'var(--text-3)',
            cursor: sel ? 'pointer' : 'not-allowed',
          }}
        >
          {t.confirmReplacement}
        </button>
      </div>
    </div>
  )
}

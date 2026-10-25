import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { postflightCheckMessages } from '../i18n/postflightCheck'
import type { Drone } from '../../types/omss'
import type { FlightControlStatus } from '../../api/flightControlApi'

interface Props {
  drone: Drone
  telemetrySnapshot?: FlightControlStatus | null
  onComplete: (results: Record<string, InspectionResult>, notes: string) => void
  onFault: (results: Record<string, InspectionResult>, notes: string) => void
}
type R = 'pass' | 'warn' | 'fail' | null
export type InspectionResult = 'PASS' | 'WARN' | 'FAIL'
interface Item {
  id: string
  cat: string
  label: string
  desc: string
  result: R
}

const BTN: Record<string, { bg: string; border: string; color: string }> = {
  'pass-active': {
    bg: 'var(--green-bg)',
    border: 'var(--green-border)',
    color: 'var(--green-text)',
  },
  'warn-active': {
    bg: 'var(--amber-bg)',
    border: 'var(--amber-border)',
    color: 'var(--amber-text)',
  },
  'fail-active': {
    bg: 'var(--red-bg)',
    border: 'var(--red-border)',
    color: 'var(--red-text)',
  },
  inactive: {
    bg: 'var(--surface)',
    border: 'var(--border)',
    color: 'var(--text-2)',
  },
}

export default function PostflightCheck({
  drone,
  telemetrySnapshot,
  onComplete,
  onFault,
}: Props) {
  const { t } = useI18n(postflightCheckMessages)
  const ITEMS: Item[] = [
    {
      id: 'a1',
      cat: t.categories.airframe,
      label: t.items.a1.label,
      desc: t.items.a1.desc,
      result: null,
    },
    {
      id: 'a2',
      cat: t.categories.airframe,
      label: t.items.a2.label,
      desc: t.items.a2.desc,
      result: null,
    },
    {
      id: 'p1',
      cat: t.categories.propulsion,
      label: t.items.p1.label,
      desc: t.items.p1.desc,
      result: null,
    },
    {
      id: 'p2',
      cat: t.categories.propulsion,
      label: t.items.p2.label,
      desc: t.items.p2.desc,
      result: null,
    },
    {
      id: 'e1',
      cat: t.categories.electronics,
      label: t.items.e1.label,
      desc: t.items.e1.desc,
      result: null,
    },
    {
      id: 'e4',
      cat: t.categories.electronics,
      label: t.items.e4.label,
      desc: t.items.e4.desc,
      result: null,
    },
    {
      id: 'e2',
      cat: t.categories.electronics,
      label: t.items.e2.label,
      desc: t.items.e2.desc,
      result: null,
    },
    {
      id: 'e3',
      cat: t.categories.electronics,
      label: t.items.e3.label,
      desc: t.items.e3.desc,
      result: null,
    },
    {
      id: 'd1',
      cat: t.categories.data,
      label: t.items.d1.label,
      desc: t.items.d1.desc,
      result: null,
    },
  ]
  const [items, setItems] = useState<Item[]>(ITEMS)
  const [notes, setNotes] = useState('')

  const done = items.filter((i) => i.result !== null).length
  const hasFail = items.some((i) => i.result === 'fail')
  const allDone = done === items.length
  const pct = Math.round((done / items.length) * 100)

  function set(id: string, r: R) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, result: r } : i)))
  }
  const cats = [...new Set(items.map((i) => i.cat))]

  function submit(callback: Props['onComplete']) {
    if (!allDone) return
    const results = Object.fromEntries(
      items.map((item) => [
        item.id,
        item.result!.toUpperCase() as InspectionResult,
      ]),
    )
    callback(results, notes.trim())
  }

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 700 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 28,
          }}
        >
          <div>
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
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
              {t.physicalInspectionOf} <strong>{drone.name || drone.id}</strong>
            </p>
            {telemetrySnapshot && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-3)',
                  margin: '6px 0 0',
                }}
              >
                {t.savedLandingTelemetry} · {t.battery}{' '}
                {typeof telemetrySnapshot.batteryPercent === 'number'
                  ? `${telemetrySnapshot.batteryPercent.toFixed(1)}%`
                  : '--'}
                {' · '}
                {t.altitude}{' '}
                {typeof telemetrySnapshot.altitudeM === 'number'
                  ? `${telemetrySnapshot.altitudeM.toFixed(1)} m`
                  : '--'}
                {' · '}
                {t.speed}{' '}
                {typeof telemetrySnapshot.speedMps === 'number'
                  ? `${telemetrySnapshot.speedMps.toFixed(1)} m/s`
                  : '--'}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: allDone
                  ? hasFail
                    ? 'var(--red)'
                    : 'var(--green)'
                  : 'var(--text)',
                lineHeight: 1,
              }}
            >
              {pct}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {done}/{items.length} {t.completed}
            </div>
          </div>
        </div>

        <div
          style={{
            height: 6,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: hasFail ? 'var(--red)' : 'var(--green)',
              borderRadius: 3,
              transition: 'width .3s',
            }}
          />
        </div>

        {cats.map((cat) => (
          <div
            key={cat}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              marginBottom: 12,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-2)',
              }}
            >
              {cat}
            </div>
            {items
              .filter((i) => i.cat === cat)
              .map((item, idx, arr) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom:
                      idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text)',
                        marginBottom: 2,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-3)',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['pass', 'warn', 'fail'] as const).map((res) => {
                      const active = item.result === res
                      const k = active ? `${res}-active` : 'inactive'
                      return (
                        <button
                          key={res}
                          onClick={() => set(item.id, res)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: BTN[k].bg,
                            border: `1px solid ${BTN[k].border}`,
                            color: BTN[k].color,
                            transition: 'all .1s',
                          }}
                        >
                          {{ pass: t.pass, warn: t.warn, fail: t.fail }[res]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        ))}

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            {t.inspectionNotes}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t.notesPlaceholder}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
          />
        </div>

        {allDone && (
          <div
            style={{
              padding: '14px',
              borderRadius: 10,
              marginBottom: 16,
              background: hasFail ? 'var(--red-bg)' : 'var(--green-bg)',
              border: `1px solid ${hasFail ? 'var(--red-border)' : 'var(--green-border)'}`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: hasFail ? 'var(--red-text)' : 'var(--green-text)',
              }}
            >
              {hasFail ? t.faultsDetected : t.allPassed}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {hasFail && allDone ? (
            <button
              onClick={() => submit(onFault)}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--red)',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {t.reportFault}
            </button>
          ) : (
            <button
              onClick={() => submit(onComplete)}
              disabled={!allDone}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: allDone ? 'var(--accent)' : 'var(--surface-2)',
                fontSize: 14,
                fontWeight: 600,
                color: allDone ? '#fff' : 'var(--text-3)',
                cursor: allDone ? 'pointer' : 'not-allowed',
              }}
            >
              {allDone
                ? t.completeInspection
                : t.completeAllItems(items.length)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

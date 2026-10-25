import { memo } from 'react'
import type { ControlStatus } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { GlassPanel } from './GlassPanel'
import { telemetryValue } from '../inFlightFormat'

export const TelemetryPanel = memo(function TelemetryPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('TelemetryPanel')
  const { t } = useI18n(inFlightControlMessages)
  const telemetryBattery =
    typeof status?.batteryPercent === 'number' &&
    Number.isFinite(status.batteryPercent)
      ? Math.max(0, Math.min(100, status.batteryPercent))
      : null
  const batteryDisplay =
    telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`
  const batteryState = status?.batteryState ?? 'NORMAL'
  const batteryMode = status?.batteryDrainMode ?? 'LANDED'
  const droneState =
    batteryMode === 'LANDED' || batteryMode === 'IDLE'
      ? t.telemetry.landed
      : t.telemetry.inFlight
  const batteryTone =
    batteryState === 'EMERGENCY'
      ? '#ef4444'
      : batteryState === 'CRITICAL'
        ? '#f87171'
        : batteryState === 'LOW'
          ? '#fbbf24'
          : '#22c55e'
  return (
    <GlassPanel
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 950,
            color: '#cbd5e1',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          {t.telemetry.title}
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: status?.online === false ? '#fca5a5' : '#93c5fd',
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: status?.online === false ? '#ef4444' : '#38bdf8',
            }}
          />
          {status?.online === false ? t.telemetry.offline : t.telemetry.live}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
        }}
      >
        {[
          [t.telemetry.altitude, telemetryValue(status?.altitudeM, 'm')],
          [t.telemetry.speed, telemetryValue(status?.speedMps, 'm/s')],
          [t.telemetry.battery, batteryDisplay],
          [t.telemetry.state, droneState],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              padding: '7px 9px',
              borderRadius: 8,
              background: 'rgba(15,23,42,.54)',
              border: '1px solid rgba(148,163,184,.14)',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 750 }}>
              {label}
            </div>
            <strong
              style={{
                display: 'block',
                marginTop: 4,
                fontFamily: 'var(--font-data)',
                fontSize: 16,
                lineHeight: 1,
                color: '#e5edf8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
        {[
          [t.telemetry.drainMode, batteryMode],
          [
            t.telemetry.position,
            status?.positionReady ? t.telemetry.ready : t.telemetry.waiting,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
            <strong
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 11,
                color: '#cbd5e1',
                textAlign: 'right',
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 7,
          height: 5,
          borderRadius: 999,
          background: 'rgba(30,41,59,.95)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${telemetryBattery ?? 0}%`,
            height: '100%',
            borderRadius: 999,
            background: batteryTone,
            transition: 'width .35s ease, background .2s ease',
          }}
        />
      </div>
    </GlassPanel>
  )
})

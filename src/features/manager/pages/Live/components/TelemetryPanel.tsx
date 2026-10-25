import { TelemetryCell } from './TelemetryCell'
import { formatFlightTime } from '../liveHelpers'
import { livePageMessages } from '../LivePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LiveTelemetry } from '../../../types/missions'

export function TelemetryPanel({ telemetry }: { telemetry: LiveTelemetry }) {
  const { t } = useI18n(livePageMessages)
  return (
    <div style={{ padding: 16 }}>
      <div className="odm-live-telemetry">
        <TelemetryCell
          label={t.telemetry.battery}
          value={
            telemetry.batteryPct !== null ? `${telemetry.batteryPct}%` : '—'
          }
          sub={t.telemetry.batteryLossHint}
        />
        <TelemetryCell
          label={t.telemetry.flightTime}
          value={
            telemetry.flightTimeSec !== null
              ? formatFlightTime(telemetry.flightTimeSec)
              : '—'
          }
        />
        <TelemetryCell
          label={t.telemetry.altitude}
          value={
            telemetry.altitudeM !== null ? `${telemetry.altitudeM} m` : '— m'
          }
        />
        <TelemetryCell
          label={t.telemetry.speed}
          value={
            telemetry.speedMs !== null ? `${telemetry.speedMs} m/s` : '— m/s'
          }
        />
        {telemetry.satelliteCount !== null && (
          <TelemetryCell
            label={t.telemetry.satellites}
            value={String(telemetry.satelliteCount)}
            sub={t.telemetry.gps}
          />
        )}
      </div>

      {/* Connection status */}
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: 'var(--tx3)',
          display: 'flex',
          gap: 16,
        }}
      >
        <span>
          connection_status{' '}
          <strong style={{ color: 'var(--tx)' }}>
            {telemetry.connectionStatus ?? '—'}
          </strong>
        </span>
        <span>
          telemetry_active{' '}
          <strong
            style={{
              color: telemetry.telemetryActive
                ? 'var(--green-fg)'
                : 'var(--red-fg)',
            }}
          >
            {telemetry.telemetryActive ? 'TRUE' : 'FALSE'}
          </strong>
        </span>
      </div>
    </div>
  )
}

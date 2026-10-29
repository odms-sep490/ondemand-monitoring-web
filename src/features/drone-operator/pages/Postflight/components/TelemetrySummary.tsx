import { TelemetryMetric } from './TelemetryMetric'
import { formatMetric } from '../postflightHelpers'
import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightControlStatus } from '../../../api/flightControlApi'

export function TelemetrySummary({
  telemetrySnapshot,
}: {
  telemetrySnapshot: FlightControlStatus
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className="stf-metric-grid">
      <TelemetryMetric
        label={t.landingBattery}
        value={formatMetric(telemetrySnapshot.batteryPercent, '%', 1)}
      />
      <TelemetryMetric
        label={t.altitude}
        value={formatMetric(telemetrySnapshot.altitudeM, ' m', 1)}
      />
      <TelemetryMetric
        label={t.speed}
        value={formatMetric(telemetrySnapshot.speedMps, ' m/s', 1)}
      />
      <TelemetryMetric
        label={t.heading}
        value={formatMetric(telemetrySnapshot.headingDeg, '°', 0)}
      />
    </div>
  )
}

import type { PreflightCheck } from '../types/mission'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { preflightDiagnosticCardMessages } from './PreflightDiagnosticCard.messages'

interface PreflightDiagnosticCardProps {
  check?: PreflightCheck | null
  batteryLevel: number
  gpsSatellites: number
  isChecking: boolean
  onRunPreflight: () => void
  hasAssignedDevice: boolean
}

export function PreflightDiagnosticCard({
  check,
  batteryLevel,
  gpsSatellites,
  isChecking,
  onRunPreflight,
  hasAssignedDevice,
}: PreflightDiagnosticCardProps) {
  const { t } = useI18n(preflightDiagnosticCardMessages)
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <p
            className="eyebrow"
            style={{ margin: '0 0 4px', fontSize: '0.65rem' }}
          >
            {t.eyebrow}
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-foreground)',
              letterSpacing: '-0.03em',
            }}
          >
            {t.cardTitle}
          </h3>
        </div>

      </div>

      {/* Diagnostics Telemetry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Battery Status Meter */}
        <div
          className="diagnostic-meter"
          style={{
            borderColor: batteryLevel >= 80 ? '#bbf7d0' : '#fca5a5',
            background:
              batteryLevel >= 80
                ? 'color-mix(in srgb, #166534 5%, var(--color-surface))'
                : 'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--color-muted)',
              }}
            >
              {t.batteryLevelLabel}
            </span>
            <Icon
              name="activity"
              style={{
                width: '16px',
                color: batteryLevel >= 80 ? '#166534' : '#991b1b',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--mono)',
              fontWeight: 800,
              color: batteryLevel >= 80 ? '#15803d' : '#b91c1c',
              margin: '8px 0 4px',
            }}
          >
            {batteryLevel}%
          </div>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: batteryLevel >= 80 ? '#166534' : '#991b1b',
            }}
          >
            {batteryLevel >= 80 ? t.batteryOk : t.batteryLow}
          </span>
        </div>

        {/* GPS Satellites Meter */}
        <div
          className="diagnostic-meter"
          style={{
            borderColor: gpsSatellites >= 8 ? '#bbf7d0' : '#fca5a5',
            background:
              gpsSatellites >= 8
                ? 'color-mix(in srgb, #166534 5%, var(--color-surface))'
                : 'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--color-muted)',
              }}
            >
              {t.gpsSatellitesLabel}
            </span>
            <Icon
              name="route"
              style={{
                width: '16px',
                color: gpsSatellites >= 8 ? '#166534' : '#991b1b',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontFamily: 'var(--mono)',
              fontWeight: 800,
              color: gpsSatellites >= 8 ? '#15803d' : '#b91c1c',
              margin: '8px 0 4px',
            }}
          >
            {gpsSatellites}{' '}
            <small style={{ fontSize: '0.7rem' }}>{t.satsUnit}</small>
          </div>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: gpsSatellites >= 8 ? '#166534' : '#991b1b',
            }}
          >
            {gpsSatellites >= 8 ? t.gpsOk : t.gpsLow}
          </span>
        </div>

        {/* Gyro & IMU Sensors Meter */}
        <div className="diagnostic-meter">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--color-muted)',
              }}
            >
              {t.gyroLabel}
            </span>
            <Icon name="shield" style={{ width: '16px', color: '#0369a1' }} />
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontFamily: 'var(--mono)',
              fontWeight: 800,
              color: '#0369a1',
              margin: '12px 0 4px',
            }}
          >
            {t.calibrated}
          </div>
          <span
            style={{ fontSize: '0.62rem', fontWeight: 600, color: '#166534' }}
          >
            {t.imuNormal}
          </span>
        </div>
      </div>

      {/* Diagnostic Trigger & Status Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button
          variant="primary"
          icon="activity"
          onClick={onRunPreflight}
          disabled={isChecking || !hasAssignedDevice}
          style={{ minHeight: '46px', padding: '0 28px' }}
        >
          {isChecking ? t.scanning : t.startPreflight}
        </Button>

        {check && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            {check.overallPassed ? (
              <span
                style={{
                  color: '#15803d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="check" /> {t.preflightPassed}
              </span>
            ) : (
              <span
                style={{
                  color: '#b91c1c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="x" /> {t.preflightFailedPrefix} ({check.faultType}).{' '}
                {t.preflightFailedSuffix}
              </span>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

import { memo } from 'react'
import type { ControlStatus } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { pressureFromAltitude } from '../inFlightFormat'
import { standardPressurePa } from '../inFlightConstants'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

export const AirPressurePanel = memo(function AirPressurePanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('AirPressurePanel')
  const { t } = useI18n(inFlightControlMessages)
  const altitudeM =
    typeof status?.altitudeM === 'number' && Number.isFinite(status.altitudeM)
      ? Math.max(0, status.altitudeM)
      : null
  const directPressure =
    typeof status?.airPressurePa === 'number' &&
    Number.isFinite(status.airPressurePa)
      ? status.airPressurePa
      : typeof status?.pressurePa === 'number' &&
          Number.isFinite(status.pressurePa)
        ? status.pressurePa
        : null
  const pressurePa =
    directPressure ??
    (altitudeM === null ? null : pressureFromAltitude(altitudeM))
  const pressureDisplay =
    pressurePa === null ? '--' : `${Math.round(pressurePa).toLocaleString()} Pa`
  const pressureKpa =
    pressurePa === null ? '--' : `${(pressurePa / 1000).toFixed(2)} kPa`
  const altitudeDisplay =
    altitudeM === null ? '--' : `${altitudeM.toFixed(1)} m`
  const deltaDisplay =
    pressurePa === null
      ? '--'
      : `${Math.round(pressurePa - standardPressurePa).toLocaleString()} Pa`
  const trend =
    pressurePa !== null && pressurePa < standardPressurePa
      ? t.airPressure.decreasing
      : t.airPressure.seaLevel

  return (
    <GlassPanel
      style={{
        width: '100%',
        padding: 9,
        border: '1px solid color-mix(in srgb, var(--fc-blue) 28%, transparent)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--fc-bg) 88%, transparent), color-mix(in srgb, var(--fc-bg) 76%, transparent))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: 'var(--fc-blue)',
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="gauge" size={13} />
          {t.airPressure.title}
        </span>
        <strong
          style={{
            borderRadius: 999,
            padding: '3px 8px',
            color: status?.online === false ? 'var(--fc-tx)' : 'var(--fc-tx)',
            background:
              status?.online === false
                ? 'color-mix(in srgb, color-mix(in srgb, var(--fc-red) 24%, var(--fc-panel)) 36%, transparent)'
                : 'color-mix(in srgb, color-mix(in srgb, var(--fc-green) 24%, var(--fc-panel)) 34%, transparent)',
            border:
              status?.online === false
                ? '1px solid color-mix(in srgb, var(--fc-red) 36%, transparent)'
                : '1px solid color-mix(in srgb, var(--fc-green) 32%, transparent)',
            fontSize: 10,
            fontWeight: 950,
          }}
        >
          {status?.online === false
            ? t.airPressure.offline
            : t.airPressure.live}
        </strong>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr .75fr',
          gap: 7,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            borderRadius: 9,
            padding: '8px 10px',
            background: 'color-mix(in srgb, var(--fc-panel) 62%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--fc-blue) 20%, transparent)',
            minWidth: 0,
          }}
        >
          <div
            style={{ color: 'var(--fc-tx2)', fontSize: 10, fontWeight: 800 }}
          >
            {t.airPressure.pressure}
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: 'var(--fc-tx)',
              fontFamily: 'var(--font-data)',
              fontSize: 16,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pressureDisplay}
          </strong>
          <div
            style={{
              marginTop: 5,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              color: 'var(--fc-blue)',
              fontFamily: 'var(--font-data)',
              fontSize: 10,
            }}
          >
            <span>{pressureKpa}</span>
            <span>{deltaDisplay}</span>
          </div>
        </div>

        <div
          style={{
            borderRadius: 9,
            padding: '8px 9px',
            background: 'color-mix(in srgb, var(--fc-panel) 50%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--fc-tx2) 14%, transparent)',
            minWidth: 0,
          }}
        >
          <div
            style={{ color: 'var(--fc-tx2)', fontSize: 10, fontWeight: 800 }}
          >
            {t.airPressure.altitude}
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: 'var(--fc-tx)',
              fontFamily: 'var(--font-data)',
              fontSize: 15,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {altitudeDisplay}
          </strong>
          <div
            style={{
              marginTop: 5,
              color: 'var(--fc-tx)',
              fontSize: 9,
              lineHeight: 1.15,
            }}
          >
            {trend}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
})

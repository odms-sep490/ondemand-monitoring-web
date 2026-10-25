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
        border: '1px solid rgba(56,189,248,.28)',
        background:
          'linear-gradient(180deg, rgba(8,18,33,.88), rgba(8,13,24,.76))',
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
            color: '#67e8f9',
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
            color: status?.online === false ? '#fecaca' : '#bbf7d0',
            background:
              status?.online === false
                ? 'rgba(127,29,29,.36)'
                : 'rgba(20,83,45,.34)',
            border:
              status?.online === false
                ? '1px solid rgba(248,113,113,.36)'
                : '1px solid rgba(34,197,94,.32)',
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
            background: 'rgba(15,23,42,.62)',
            border: '1px solid rgba(56,189,248,.2)',
            minWidth: 0,
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 800 }}>
            {t.airPressure.pressure}
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: '#e0f2fe',
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
              color: '#93c5fd',
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
            background: 'rgba(15,23,42,.5)',
            border: '1px solid rgba(148,163,184,.14)',
            minWidth: 0,
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 800 }}>
            {t.airPressure.altitude}
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: '#f8fafc',
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
              color: '#cbd5e1',
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

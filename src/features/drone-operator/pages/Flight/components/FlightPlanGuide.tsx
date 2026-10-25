import type { MissionRoutePoint } from '../../../types/omss'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import {
  planReasonLabel,
  planHeadingLabel,
  planSpeedLabel,
} from '../planHelpers'

export function FlightPlanGuide({
  routePoints,
}: {
  routePoints: MissionRoutePoint[]
}) {
  const { t } = useI18n(inFlightControlMessages)
  if (routePoints.length === 0) return null

  return (
    <div
      style={{
        marginTop: 10,
        paddingTop: 9,
        borderTop: '1px solid rgba(148,163,184,.18)',
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
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          {t.flightPlanGuide}
        </span>
        <strong
          style={{
            color: '#67e8f9',
            fontSize: 10,
            fontFamily: 'var(--font-data)',
          }}
        >
          HDG / ALT / SPD
        </strong>
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        {routePoints.map((point, index) => (
          <div
            key={point.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              alignItems: 'center',
              gap: 7,
              minHeight: 28,
              padding: '5px 7px',
              border: '1px solid rgba(148,163,184,.16)',
              borderRadius: 7,
              background: 'rgba(15,23,42,.42)',
            }}
          >
            <strong
              style={{
                color: '#f8fafc',
                fontSize: 11,
                fontFamily: 'var(--font-data)',
              }}
            >
              {point.sequence}
            </strong>
            <span
              style={{
                minWidth: 0,
                color: '#cbd5e1',
                fontSize: 11,
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {planReasonLabel(point, t)}
            </span>
            <span
              style={{
                color: '#e5edf8',
                fontSize: 10,
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {planHeadingLabel(point, routePoints[index + 1], t.hold)} /{' '}
              {point.altitudeM.toFixed(0)}m / {planSpeedLabel(point)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

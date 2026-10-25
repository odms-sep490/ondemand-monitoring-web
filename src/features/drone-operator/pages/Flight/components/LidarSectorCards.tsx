import { getLidarSeverityStyle } from '../lidarHelpers'
import { Icon } from './Icon'
import type {
  LidarDirectionState,
  LidarDirection,
  LidarSeverity,
} from '../inFlightTypes'

export function LidarSectorCards({
  directionStates,
  directionLabel,
  severityLabel,
}: {
  directionStates: LidarDirectionState[]
  directionLabel: Record<LidarDirection, string>
  severityLabel: Record<LidarSeverity, string>
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 5,
        padding: '0 8px 6px',
      }}
    >
      {directionStates.map((item) => {
        const style = getLidarSeverityStyle(item.severity)
        return (
          <div
            key={item.direction}
            style={{
              borderRadius: 9,
              padding: '6px 6px',
              background: 'rgba(15,23,42,.62)',
              border: `1px solid ${style.badgeBorder}`,
            }}
          >
            <div
              style={{
                color: '#dbeafe',
                fontSize: 8,
                fontWeight: 950,
                marginBottom: 2,
              }}
            >
              {directionLabel[item.direction]}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <strong
                style={{
                  color: '#e5edf8',
                  fontFamily: 'var(--font-data)',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.display}
              </strong>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  color: style.icon,
                  background: style.badgeBg,
                  border: `1px solid ${style.badgeBorder}`,
                }}
                title={severityLabel[item.severity]}
              >
                {item.severity === 'CLEAR' ? (
                  <Icon name="shield" size={11} />
                ) : item.severity === 'UNKNOWN' ? (
                  <Icon name="minus" size={10} />
                ) : (
                  <Icon name="alert" size={11} />
                )}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

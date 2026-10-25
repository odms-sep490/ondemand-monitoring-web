import { Icon } from './Icon'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { LidarDirectionState, LidarDirection } from '../inFlightTypes'

export function LidarRadarSummary({
  alertStyle,
  fresh,
  lidar,
  nearestObstacle,
  directionLabel,
}: {
  alertStyle: {
    fill: string
    stroke: string
    text: string
    badgeBg: string
    badgeBorder: string
    icon: string
  }
  fresh: boolean
  lidar:
    | {
        enabled?: boolean | undefined
        available?: boolean | undefined
        status?: string | undefined
        direction?: string | undefined
        rangeMaxM?: number | undefined
        frontM?: number | undefined
        frontLeftM?: number | undefined
        frontRightM?: number | undefined
        leftM?: number | undefined
        rightM?: number | undefined
        backM?: number | undefined
        nearestM?: number | undefined
        nearestAngleDeg?: number | undefined
        nearestDirection?: string | undefined
        scanAgeS?: number | null | undefined
      }
    | undefined
  nearestObstacle: LidarDirectionState
  directionLabel: Record<LidarDirection, string>
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <div style={{ padding: '0 9px 9px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 10,
          padding: '8px 9px',
          background: alertStyle.badgeBg,
          border: `1px solid ${alertStyle.badgeBorder}`,
        }}
      >
        <span
          style={{
            width: 23,
            height: 23,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            color: alertStyle.icon,
            background: 'rgba(2,6,23,.26)',
          }}
        >
          {!fresh || !lidar?.available ? (
            <Icon name="minus" size={14} />
          ) : nearestObstacle ? (
            <Icon
              name={nearestObstacle.severity === 'CLEAR' ? 'shield' : 'alert'}
              size={15}
            />
          ) : (
            <Icon name="shield" size={15} />
          )}
        </span>
        <div
          style={{
            display: 'grid',
            gap: 2,
            minWidth: 0,
          }}
        >
          <strong style={{ color: '#f8fafc', fontSize: 10, lineHeight: 1.15 }}>
            {!fresh || !lidar?.available
              ? fresh
                ? t.lidarRadar.unavailable
                : t.lidarRadar.stale
              : nearestObstacle
                ? t.lidarRadar.nearestObstacle(
                    nearestObstacle.display,
                    directionLabel[nearestObstacle.direction],
                  )
                : t.lidarRadar.noObstacle}
          </strong>
          <span style={{ color: '#cbd5e1', fontSize: 8, lineHeight: 1.15 }}>
            {nearestObstacle?.severity === 'DANGER'
              ? t.lidarRadar.holdPosition
              : nearestObstacle?.severity === 'CAUTION'
                ? t.lidarRadar.proceedCaution
                : t.lidarRadar.sectorsClear}
          </span>
        </div>
      </div>
    </div>
  )
}

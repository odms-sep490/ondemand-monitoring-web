import { memo } from 'react'
import type {
  ControlStatus,
  LidarDirection,
  LidarSeverity,
  LidarDirectionState,
} from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import {
  getLidarFresh,
  getMinValidDistance,
  getLidarSeverity,
  formatLidarDistance,
  getLidarSeverityStyle,
} from '../lidarHelpers'
import { GlassPanel } from './GlassPanel'
import { LidarRadarHeader } from './LidarRadarHeader'
import { LidarRadarDial } from './LidarRadarDial'
import { LidarSectorCards } from './LidarSectorCards'
import { LidarRadarSummary } from './LidarRadarSummary'

export const LidarRadarOverlay = memo(function LidarRadarOverlay({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarRadarOverlay')
  const { t } = useI18n(inFlightControlMessages)
  const directionLabel: Record<LidarDirection, string> = {
    FRONT: t.lidarRadar.direction.front,
    LEFT: t.lidarRadar.direction.left,
    RIGHT: t.lidarRadar.direction.right,
    BACK: t.lidarRadar.direction.back,
  }
  const severityLabel: Record<LidarSeverity, string> = {
    DANGER: t.lidarRadar.status.danger,
    CAUTION: t.lidarRadar.status.caution,
    CLEAR: t.lidarRadar.status.clear,
    UNKNOWN: t.lidarRadar.status.unknown,
  }
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const maxRange =
    typeof lidar?.rangeMaxM === 'number' && Number.isFinite(lidar.rangeMaxM)
      ? lidar.rangeMaxM
      : 60
  const rawDirectionStates: Array<
    Omit<LidarDirectionState, 'severity' | 'display'>
  > = [
    {
      direction: 'FRONT',
      value: getMinValidDistance([
        lidar?.frontM,
        lidar?.frontLeftM,
        lidar?.frontRightM,
      ]),
    },
    {
      direction: 'LEFT',
      value: getMinValidDistance([lidar?.leftM]),
    },
    {
      direction: 'RIGHT',
      value: getMinValidDistance([lidar?.rightM]),
    },
    {
      direction: 'BACK',
      value: getMinValidDistance([lidar?.backM]),
    },
  ]
  const directionStates: LidarDirectionState[] = rawDirectionStates.map(
    (item) => {
      const severity = getLidarSeverity(item.value, fresh, maxRange)
      return {
        ...item,
        severity,
        display: formatLidarDistance(item.value, maxRange),
      }
    },
  )
  const orderedSeverities: LidarSeverity[] = [
    'DANGER',
    'CAUTION',
    'UNKNOWN',
    'CLEAR',
  ]
  const panelSeverity = fresh
    ? (orderedSeverities.find((severity) =>
        directionStates.some((item) => item.severity === severity),
      ) ?? 'UNKNOWN')
    : 'UNKNOWN'
  const statusLabel = fresh
    ? panelSeverity === 'DANGER'
      ? t.lidarRadar.status.danger
      : panelSeverity === 'CAUTION'
        ? t.lidarRadar.status.caution
        : panelSeverity === 'CLEAR'
          ? t.lidarRadar.status.active
          : t.lidarRadar.status.unknown
    : t.lidarRadar.status.stale
  const nearestObstacle = directionStates
    .filter(
      (item) =>
        item.value !== null &&
        item.severity !== 'UNKNOWN' &&
        item.value < maxRange * 0.995,
    )
    .sort((a, b) => Number(a.value) - Number(b.value))[0]
  const alertStyle = getLidarSeverityStyle(
    !fresh ? 'UNKNOWN' : (nearestObstacle?.severity ?? 'CLEAR'),
  )
  const panelBorder = getLidarSeverityStyle(panelSeverity)

  return (
    <GlassPanel
      style={{
        width: '100%',
        minWidth: 0,
        alignSelf: 'start',
        padding: 0,
        overflow: 'hidden',
        border: `1px solid ${panelBorder.badgeBorder}`,
        background:
          'linear-gradient(180deg, rgba(8,18,33,.9), rgba(8,13,24,.78))',
      }}
    >
      <LidarRadarHeader
        panelBorder={panelBorder}
        statusLabel={statusLabel}
        maxRange={maxRange}
      />
      <LidarRadarDial
        directionStates={directionStates}
        directionLabel={directionLabel}
        severityLabel={severityLabel}
      />
      <LidarSectorCards
        directionStates={directionStates}
        directionLabel={directionLabel}
        severityLabel={severityLabel}
      />
      <LidarRadarSummary
        alertStyle={alertStyle}
        fresh={fresh}
        lidar={lidar}
        nearestObstacle={nearestObstacle}
        directionLabel={directionLabel}
      />
    </GlassPanel>
  )
})

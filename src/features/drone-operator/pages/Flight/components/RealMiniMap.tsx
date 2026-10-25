import { memo, useState } from 'react'
import type { ControlStatus } from '../inFlightTypes'
import type { Mission } from '../../../types/omss'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useSimulationMap } from '../useSimulationMap'
import {
  worldToViewportPercent,
  SIMULATION_MAP_DEFAULT_CROP,
} from '../../../../../shared/lib/simulationMapProjection'
import { statusToSimulationPoint } from '../planHelpers'
import { env } from '../../../../../config/env'
import { GlassPanel } from './GlassPanel'
import { MiniMapToolbar } from './MiniMapToolbar'
import { MiniMapSvg } from './MiniMapSvg'

export const RealMiniMap = memo(function RealMiniMap({
  status,
  mission,
}: {
  status: ControlStatus | null
  mission: Mission
}) {
  useRenderDiagnostics('MiniMap')
  const { meta } = useSimulationMap()
  const [zoom, setZoom] = useState(1)
  const [follow, setFollow] = useState(false)
  const width = 320
  const height = 190

  const worldToMinimap = (x: number, y: number) => {
    if (!meta) return [width / 2, height / 2] as const
    const point = worldToViewportPercent(
      { simX: x, simY: y },
      meta,
      SIMULATION_MAP_DEFAULT_CROP,
    )
    const px = (point.x / 100) * width
    const py = (point.y / 100) * height
    return [px, py] as const
  }

  const simPoint = statusToSimulationPoint(status)
  const droneWorld = simPoint
    ? { x: simPoint[0], y: simPoint[1] }
    : { x: 0, y: 0 }
  const [droneX, droneY] = worldToMinimap(droneWorld.x, droneWorld.y)
  const routePoints = mission.routePoints ?? []
  const routeScreenPoints = routePoints.map((point) => {
    const [x, y] = worldToMinimap(point.simX, point.simY)
    return { ...point, x, y }
  })
  const routePath = routeScreenPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')
  const routeTargetPoint =
    routeScreenPoints.find((point) =>
      ['TARGET', 'ORDER'].includes(point.reason?.toUpperCase()),
    ) ?? routeScreenPoints[routeScreenPoints.length - 1]
  const orderTargetPoint =
    typeof mission.targetSimX === 'number' &&
    typeof mission.targetSimY === 'number'
      ? (() => {
          const [x, y] = worldToMinimap(mission.targetSimX, mission.targetSimY)
          return { x, y }
        })()
      : null
  const missionTargetPoint = routeTargetPoint ?? orderTargetPoint
  const viewWidth = width / zoom
  const viewHeight = height / zoom
  const viewX = follow
    ? Math.max(0, Math.min(width - viewWidth, droneX - viewWidth / 2))
    : (width - viewWidth) / 2
  const viewY = follow
    ? Math.max(0, Math.min(height - viewHeight, droneY - viewHeight / 2))
    : (height - viewHeight) / 2
  const yaw = status?.yawDeg ?? 0
  const mapImagePath =
    meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion
    ? `?v=${encodeURIComponent(meta.imageVersion)}`
    : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`
  const crop = SIMULATION_MAP_DEFAULT_CROP
  const visibleMapWidth = 100 - crop.left - crop.right
  const visibleMapHeight = 100 - crop.top - crop.bottom
  const mapX = -(crop.left / visibleMapWidth) * width
  const mapY = -(crop.top / visibleMapHeight) * height
  const mapWidth = (100 / visibleMapWidth) * width
  const mapHeight = (100 / visibleMapHeight) * height

  return (
    <GlassPanel style={{ width: '100%', overflow: 'hidden', flexShrink: 0 }}>
      <MiniMapToolbar setFollow={setFollow} follow={follow} setZoom={setZoom} />
      <MiniMapSvg
        viewX={viewX}
        viewY={viewY}
        viewWidth={viewWidth}
        viewHeight={viewHeight}
        width={width}
        height={height}
        mapImageUrl={mapImageUrl}
        mapX={mapX}
        mapY={mapY}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        routeScreenPoints={routeScreenPoints}
        routePath={routePath}
        zoom={zoom}
        missionTargetPoint={missionTargetPoint}
        droneX={droneX}
        droneY={droneY}
        yaw={yaw}
      />
    </GlassPanel>
  )
})

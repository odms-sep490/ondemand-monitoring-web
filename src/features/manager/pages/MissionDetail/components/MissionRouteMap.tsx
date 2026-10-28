import { useEffect, useState } from 'react'

import { env } from '../../../../../config/env'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../../../shared/lib/simulationMapProjection'
import type { PlanWaypointResponse } from '../../../types/missions'
import { getLanguage } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: { minX: number; maxX: number; minY: number; maxY: number }
}

function useSimulationMapMeta() {
  const [meta, setMeta] = useState<SimulationMapMeta | null>(null)
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        if (!response.ok) return
        const payload = (await response.json()) as SimulationMapMeta
        if (alive) setMeta(payload)
      } catch {
        if (alive) setMeta(null)
      }
    })()
    return () => {
      alive = false
    }
  }, [])
  return meta
}

export function waypointReasonLabel(value?: string | null): string {
  const x = missionDetailPageMessages[getLanguage()].extra
  if (!value) return x.wpDefault
  if (value === 'START') return x.wpStart
  if (value === 'TARGET' || value === 'TARGET_APPROACH') return x.wpTarget
  if (value === 'CRUISE') return x.wpCruise
  if (value === 'TERRAIN_CLEARANCE') return x.wpTerrain
  if (value === 'OBSTACLE_AVOIDANCE') return x.wpObstacle
  return value.replaceAll('_', ' ').toLowerCase()
}

const clamp = (point: { x: number; y: number }) => ({
  x: Math.min(94, Math.max(6, point.x)),
  y: Math.min(94, Math.max(6, point.y)),
})

/** Top-down flight-route map (same projection as the operator mission view). */
export function MissionRouteMap({
  waypoints,
  labels,
}: {
  waypoints: PlanWaypointResponse[]
  labels: {
    title: string
    drone: string
    route: string
    waypoint: string
    target: string
    empty: string
    satellite: string
  }
}) {
  const meta = useSimulationMapMeta()
  // Visible (cropped) aspect ratio of the map image; fixed once the image loads.
  const [ratio, setRatio] = useState(0.97)
  const route = [...waypoints].sort((a, b) => a.sequence - b.sequence)
  const target = route.at(-1)

  const bounds =
    route.length > 0
      ? (meta?.imageBounds ??
        meta ??
        route.reduce(
          (acc, p) => ({
            minX: Math.min(acc.minX, p.simX),
            maxX: Math.max(acc.maxX, p.simX),
            minY: Math.min(acc.minY, p.simY),
            maxY: Math.max(acc.maxY, p.simY),
          }),
          {
            minX: route[0].simX,
            maxX: route[0].simX,
            minY: route[0].simY,
            maxY: route[0].simY,
          },
        ))
      : null

  const project = (point: { simX: number; simY: number }) => {
    if (!bounds) return { x: 50, y: 50 }
    if (meta) {
      return clamp(
        worldToViewportPercent(point, meta, SIMULATION_MAP_DEFAULT_CROP),
      )
    }
    const width = Math.max(1, bounds.maxX - bounds.minX)
    const height = Math.max(1, bounds.maxY - bounds.minY)
    const pad = 10
    return clamp({
      x: pad + ((point.simX - bounds.minX) / width) * (100 - pad * 2),
      y: pad + ((bounds.maxY - point.simY) / height) * (100 - pad * 2),
    })
  }

  const projected = route.map(project)
  const polyline = projected.map((p) => `${p.x},${p.y}`).join(' ')
  const targetPoint = target ? project(target) : null

  const imagePath = meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const version = meta?.imageVersion
    ? `?v=${encodeURIComponent(meta.imageVersion)}`
    : ''
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_DEFAULT_CROP)

  return (
    <div
      className="odm-rm"
      style={{ aspectRatio: String(ratio) }}
      role="img"
      aria-label={labels.title}
    >
      <img
        alt=""
        src={`${env.apiBaseUrl}${imagePath}${version}`}
        className="odm-rm-img"
        style={imageStyle}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget
          if (naturalWidth > 0 && naturalHeight > 0) {
            const crop = SIMULATION_MAP_DEFAULT_CROP
            const visibleW = (100 - crop.left - crop.right) / 100
            const visibleH = (100 - crop.top - crop.bottom) / 100
            setRatio((naturalWidth * visibleW) / (naturalHeight * visibleH))
          }
        }}
      />
      <div className="odm-rm-badge">{labels.satellite}</div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="odm-rm-svg"
      >
        {polyline ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {targetPoint ? (
          <circle
            cx={targetPoint.x}
            cy={targetPoint.y}
            r="5.4"
            fill="#ef4444"
            opacity="0.2"
          />
        ) : null}
        {route.map((point, index) => {
          const p = projected[index]
          const isHome = index === 0
          const isTarget = index === route.length - 1
          const fill = isHome ? '#0f172a' : isTarget ? '#ef4444' : '#2563eb'
          const radius = isHome || isTarget ? 3.2 : 2.1
          return (
            <g key={point.id}>
              <title>{`WP ${point.sequence} · ${waypointReasonLabel(point.reason)} · X ${point.simX.toFixed(2)} · Y ${point.simY.toFixed(2)}`}</title>
              <circle
                cx={p.x}
                cy={p.y}
                r={radius + 1.5}
                fill={fill}
                opacity="0.16"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={radius}
                fill={fill}
                stroke="#fff"
                strokeWidth="0.9"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={p.x}
                y={p.y + 0.8}
                textAnchor="middle"
                fontSize={isHome || isTarget ? '2.8' : '2'}
                fontWeight="800"
                fill="#fff"
              >
                {isHome ? 'H' : isTarget ? 'T' : point.sequence}
              </text>
            </g>
          )
        })}
      </svg>

      {route.length === 0 ? (
        <div className="odm-rm-empty">{labels.empty}</div>
      ) : null}
    </div>
  )
}

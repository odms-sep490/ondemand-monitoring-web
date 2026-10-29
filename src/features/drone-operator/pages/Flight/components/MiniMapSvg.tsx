import { getLanguage } from '../../../../../shared/i18n'
import { copy } from './cockpitCopy'
import { inFlightControlMessages } from './InFlightControl.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MiniMapSvg({
  viewX,
  viewY,
  viewWidth,
  viewHeight,
  width,
  height,
  mapImageUrl,
  mapX,
  mapY,
  mapWidth,
  mapHeight,
  routeScreenPoints,
  routePath,
  zoom,
  missionTargetPoint,
  droneX,
  droneY,
  yaw,
}: {
  viewX: number
  viewY: number
  viewWidth: number
  viewHeight: number
  width: 320
  height: 190
  mapImageUrl: string
  mapX: number
  mapY: number
  mapWidth: number
  mapHeight: number
  routeScreenPoints: {
    x: number
    y: number
    id: string
    sequence: number
    simX: number
    simY: number
    altitudeM: number
    speedMps?: number | undefined
    reason: string
  }[]
  routePath: string
  zoom: number
  missionTargetPoint: {
    x: number
    y: number
    id: string
    sequence: number
    simX: number
    simY: number
    altitudeM: number
    speedMps?: number | undefined
    reason: string
  }
  droneX: number
  droneY: number
  yaw: number
}) {
  const { t } = useI18n(inFlightControlMessages)
  return (
    <svg
      className="mission-control-map"
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', background: 'rgba(15,23,42,.55)' }}
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="rgba(15,23,42,.55)"
      />
      <image
        href={mapImageUrl}
        x={mapX}
        y={mapY}
        width={mapWidth}
        height={mapHeight}
        preserveAspectRatio="xMidYMid slice"
        opacity=".92"
      />
      <rect x="0" y="0" width={width} height={height} fill="rgba(2,6,23,.14)" />
      {routeScreenPoints.length > 1 && (
        <g>
          <path
            d={routePath}
            fill="none"
            stroke="rgba(2,6,23,.75)"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={routePath}
            fill="none"
            stroke="rgba(34,211,238,.96)"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
          <text
            x={viewX + viewWidth - 8 / zoom}
            y={viewY + viewHeight - 10 / zoom}
            fill="#cffafe"
            fontSize={8 / zoom}
            fontWeight="900"
            textAnchor="end"
            paintOrder="stroke"
            stroke="rgba(15,23,42,.9)"
            strokeWidth={2 / zoom}
          >
            {copy[getLanguage()].routePlan} · {routeScreenPoints.length} WP
          </text>
        </g>
      )}
      {routeScreenPoints.map((point) => {
        const reason = point.reason?.toUpperCase()
        const isTarget = reason === 'TARGET' || reason === 'ORDER'
        const isStart = reason === 'START' || point.sequence === 0
        return (
          <g key={point.id} transform={`translate(${point.x} ${point.y})`}>
            <circle
              r={isTarget ? 5.5 : isStart ? 5 : 4}
              fill={isTarget ? '#ef4444' : isStart ? '#60a5fa' : '#fbbf24'}
              stroke="#fff7ed"
              strokeWidth="1"
            />
            <text
              x={7}
              y={3}
              fill="#fef3c7"
              fontSize="7"
              fontWeight="900"
              paintOrder="stroke"
              stroke="rgba(15,23,42,.85)"
              strokeWidth="2"
            >
              {point.sequence}
            </text>
          </g>
        )
      })}
      {missionTargetPoint && (
        <g
          transform={`translate(${missionTargetPoint.x} ${missionTargetPoint.y})`}
        >
          <circle
            r="13"
            fill="rgba(239,68,68,.22)"
            stroke="rgba(254,202,202,.85)"
            strokeWidth="1.5"
          />
          <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          <path
            d="M0 -19 L4 -10 L-4 -10 Z"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text
            x="10"
            y="-10"
            fill="#fee2e2"
            fontSize="8"
            fontWeight="900"
            paintOrder="stroke"
            stroke="rgba(15,23,42,.9)"
            strokeWidth="2"
          >
            {t.map.order}
          </text>
        </g>
      )}
      <g transform={`translate(${droneX} ${droneY}) rotate(${yaw})`}>
        <circle
          cx="0"
          cy="0"
          r="8"
          fill="rgba(96,165,250,.24)"
          stroke="rgba(191,219,254,.8)"
          strokeWidth="1"
        />
        <path
          d="M0 -9 L6 7 L0 4 L-6 7 Z"
          fill="#60a5fa"
          stroke="#eff6ff"
          strokeWidth="1"
        />
      </g>
      <text
        x={viewX + 8 / zoom}
        y={viewY + 13 / zoom}
        fill="#e5edf8"
        fontSize={9 / zoom}
        fontWeight="800"
      >
        {t.map.north}
      </text>
      <path
        d={`M${viewX + 10 / zoom} ${viewY + 24 / zoom}v-8`}
        stroke="#e5edf8"
        strokeWidth={1.5 / zoom}
        strokeLinecap="round"
      />
    </svg>
  )
}

import { useI18n } from '../../../../../shared/i18n'
import { livePageMessages } from '../LivePage.messages'

// ── Map placeholder ────────────────────────────────────────────────────────

export function MapPlaceholder({
  lat,
  lon,
  missionCode,
}: {
  lat: number | null
  lon: number | null
  missionCode: string
}) {
  const { t } = useI18n(livePageMessages)
  return (
    <div
      className="odm-live-map"
      style={{ height: 280 }}
      role="img"
      aria-label={t.mapAriaLabel(missionCode)}
    >
      {/* Static SVG map placeholder — no real map library in scope [evd/00-PLAN.md §8] */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 280"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="600" height="280" fill="var(--map-bg)" />
        {/* Road grid */}
        {[60, 140, 220, 300, 380, 460, 540].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="280"
            stroke="var(--map-road)"
            strokeWidth="4"
          />
        ))}
        {[56, 112, 168, 224].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="600"
            y2={y}
            stroke="var(--map-road)"
            strokeWidth="4"
          />
        ))}
        {/* Water body */}
        <ellipse
          cx="100"
          cy="50"
          rx="80"
          ry="30"
          fill="var(--map-water)"
          opacity="0.7"
        />
        {/* Park */}
        <rect
          x="400"
          y="160"
          width="80"
          height="60"
          fill="var(--map-park)"
          opacity="0.7"
        />
        {/* Orbit circle */}
        <circle
          cx="300"
          cy="140"
          r="60"
          fill="none"
          stroke="var(--blue-dot)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {/* Drone position marker */}
        <circle cx="300" cy="90" r="8" fill="var(--blue-solid)" opacity="0.9" />
        <circle
          cx="300"
          cy="90"
          r="14"
          fill="none"
          stroke="var(--blue-solid)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>
      {/* Lat/lon overlay */}
      {lat !== null && lon !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,.55)',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
          }}
        >
          {lat.toFixed(4)}, {lon.toFixed(4)}
        </div>
      )}
    </div>
  )
}

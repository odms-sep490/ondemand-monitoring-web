import { copy } from './cockpitCopy'

type Props = {
  heading?: number | null
  speedMps?: number | null
  altitudeM?: number | null
  batteryPercent?: number | null
  latitude?: number | null
  longitude?: number | null
  photoCount?: number | null
  photoTotal?: number | null
  gimbalPitchDeg?: number
  language?: 'vi' | 'en'
}

const CARDINALS: Record<number, string> = {
  0: 'N',
  90: 'E',
  180: 'S',
  270: 'W',
}

function finite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function headingTape(heading: number) {
  const base = Math.round(heading / 10) * 10
  return [-30, -20, -10, 0, 10, 20, 30].map((offset) => {
    const value = (((base + offset) % 360) + 360) % 360
    return {
      key: offset,
      label: CARDINALS[value] ?? String(value),
      major: value in CARDINALS,
      offset: base + offset - heading,
    }
  })
}

function coordinate(
  value: number | null | undefined,
  positive: string,
  negative: string,
) {
  if (!finite(value)) return '--'
  return `${Math.abs(value).toFixed(5)} ${value >= 0 ? positive : negative}`
}

export function CameraHud({
  heading,
  speedMps,
  altitudeM,
  batteryPercent,
  latitude,
  longitude,
  photoCount,
  photoTotal,
  gimbalPitchDeg = -90,
  language = 'vi',
}: Props) {
  const cc = copy[language]
  const headingValue = finite(heading)
    ? ((Math.round(heading) % 360) + 360) % 360
    : null
  return (
    <div className="camera-hud">
      <div className="camera-hud__frame" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="camera-hud__top">
        <span className="camera-hud__chip is-live">LIVE</span>
        <span className="camera-hud__chip">CAMERA</span>
        <span className="camera-hud__chip">RGB</span>
        <span className="camera-hud__chip">GIMBAL {gimbalPitchDeg}°</span>
      </div>

      <div className="camera-hud__heading">
        {headingValue !== null ? (
          <div className="camera-hud__tape">
            {headingTape(heading as number).map((tick) => (
              <span
                key={tick.key}
                className={tick.major ? 'is-major' : undefined}
                style={{ transform: `translateX(${tick.offset * 3}px)` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="camera-hud__heading-value">
          {headingValue !== null ? `${headingValue}°` : '--°'}
        </div>
        <div className="camera-hud__heading-pointer" />
      </div>

      <div className="camera-hud__crosshair" />

      <div className="camera-hud__readout is-left">
        <strong>{finite(speedMps) ? speedMps.toFixed(1) : '--'}</strong>
        <span>M/S</span>
      </div>
      <div className="camera-hud__readout is-right">
        <strong>{finite(altitudeM) ? Math.round(altitudeM) : '--'}</strong>
        <span>M AGL</span>
      </div>

      <div className="camera-hud__bottom is-left">
        <span>CAM1 · RGB · 4K</span>
        <span>{coordinate(latitude, 'N', 'S')}</span>
        <span>{coordinate(longitude, 'E', 'W')}</span>
      </div>
      <div className="camera-hud__bottom is-right">
        {finite(photoCount) ? (
          <span>
            {cc.hudPhotos} {photoCount}
            {finite(photoTotal) ? `/${photoTotal}` : ''}
          </span>
        ) : null}
        <span>{cc.hudMission}</span>
        <span>
          {cc.hudBattery}{' '}
          {finite(batteryPercent) ? `${Math.round(batteryPercent)}%` : '--'}
        </span>
      </div>

      <div className="camera-hud__credit">Imagery © Esri</div>
    </div>
  )
}

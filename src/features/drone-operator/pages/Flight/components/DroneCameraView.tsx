import { useState } from 'react'
import { CameraHud } from './CameraHud'
import { CameraSatelliteMap } from './CameraSatelliteMap'

export type DroneCameraTelemetry = {
  latitude?: number | null
  longitude?: number | null
  heading?: number | null
  altitude?: number | null
  speedMps?: number | null
  batteryPercent?: number | null
  photoCount?: number | null
  photoTotal?: number | null
}

type Props = {
  telemetry: DroneCameraTelemetry | null
  language?: 'vi' | 'en'
  className?: string
  hideHud?: boolean
  expandable?: boolean
}

function hasFix(t: DroneCameraTelemetry | null) {
  return Boolean(
    t &&
    typeof t.latitude === 'number' &&
    typeof t.longitude === 'number' &&
    Number.isFinite(t.latitude) &&
    Number.isFinite(t.longitude) &&
    (t.latitude !== 0 || t.longitude !== 0),
  )
}

/**
 * Drone "camera": real satellite imagery centred on the live telemetry position
 * (the same lat/lon the main flight map uses) with a HUD on top. Not a video stream.
 */
export function DroneCameraView({
  telemetry,
  language = 'vi',
  className,
  hideHud,
  expandable,
}: Props) {
  const ready = hasFix(telemetry)
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className={`drone-camera-view${className ? ` ${className}` : ''}${expanded ? ' is-expanded' : ''}${ready ? '' : ' is-waiting'}`}
    >
      <CameraSatelliteMap
        latitude={telemetry?.latitude}
        longitude={telemetry?.longitude}
        heading={telemetry?.heading}
        altitude={telemetry?.altitude}
      />
      {hideHud ? null : (
        <CameraHud
          heading={telemetry?.heading}
          speedMps={telemetry?.speedMps}
          altitudeM={telemetry?.altitude}
          batteryPercent={telemetry?.batteryPercent}
          latitude={telemetry?.latitude}
          longitude={telemetry?.longitude}
          photoCount={telemetry?.photoCount}
          photoTotal={telemetry?.photoTotal}
          language={language}
        />
      )}
      {expandable ? (
        <button
          type="button"
          className="camera-expand"
          onClick={() => setExpanded((value) => !value)}
          aria-label={
            expanded
              ? language === 'en'
                ? 'Shrink camera'
                : 'Thu nhỏ camera'
              : language === 'en'
                ? 'Enlarge camera'
                : 'Phóng to camera'
          }
        >
          {expanded ? '⤡' : '⤢'}
        </button>
      ) : null}
      {ready ? null : (
        <div className="camera-waiting" role="status">
          <span className="camera-waiting__radar" aria-hidden="true" />
          <strong>
            {language === 'en' ? 'WAITING FOR TELEMETRY' : 'ĐANG CHỜ TELEMETRY'}
          </strong>
          <small>
            {language === 'en'
              ? 'Camera turns on when the drone reports GPS'
              : 'Camera sẽ bật khi drone gửi tọa độ GPS'}
          </small>
        </div>
      )}
    </div>
  )
}

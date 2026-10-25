import { inFlightControlMessages } from './components/InFlightControl.messages'

export type FlightCommand =
  | 'takeoff'
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'yaw_left'
  | 'yaw_right'
  | 'stop'
  | 'land'
  | 'return_to_base'
  | 'emergency_stop'
  | 'auto_plan_start'
  | 'gps_target_start'
  | 'camera_switch'
  | 'camera_front'
  | 'camera_monitor_toggle'
  | 'lidar_monitor_toggle'
  | 'telemetry_monitor_toggle'
  | 'photo'
  | 'video_toggle'
  | 'speed_up'
  | 'speed_down'
  | 'safety_toggle'
  | 'thermal_toggle'

export type WeatherPreset =
  'CLEAR_DAY' | 'CLOUDY' | 'FOGGY' | 'WINDY' | 'LIGHT_RAIN' | 'HEAVY_RAIN'

export type IconName =
  | 'drone'
  | 'settings'
  | 'crosshair'
  | 'camera'
  | 'eye'
  | 'joystick'
  | 'map'
  | 'plus'
  | 'minus'
  | 'takeoff'
  | 'land'
  | 'alert'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'moveForward'
  | 'moveBack'
  | 'moveLeft'
  | 'moveRight'
  | 'altitudeUp'
  | 'altitudeDown'
  | 'rotateLeft'
  | 'rotateRight'
  | 'gauge'
  | 'photo'
  | 'video'
  | 'radar'
  | 'activity'
  | 'shield'
  | 'thermometer'
  | 'check'
  | 'chevronRight'

export type ControlStatus = {
  online?: boolean
  missionId?: string | null
  deviceId?: string | null
  positionReady?: boolean
  positionGazebo?: { x: number; y: number }
  positionNed?: { northM: number; eastM: number; downM: number }
  velocityNed?: { northMps: number; eastMps: number; downMps: number }
  positionGps?: {
    latitude: number
    longitude: number
    absoluteAltitudeM: number
    relativeAltitudeM: number
  } | null
  inAir?: boolean
  yawDeg?: number
  altitudeM?: number
  pressurePa?: number
  airPressurePa?: number
  speedMps?: number
  batteryPercent?: number
  rawPx4BatteryPercent?: number | null
  batteryState?: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
  freshness?: {
    px4BatteryAgeS?: number | null
  }
  batteryDrainMode?:
    'LANDED' | 'IDLE' | 'HOVER' | 'CRUISE' | 'ASCEND' | 'DESCEND'
  autoPlan?: {
    active?: boolean
    status?: string
    currentIndex?: number
    total?: number
  }
  cameraMode?: 'FRONT' | 'DOWN'
  cameraPitchDeg?: number
  thermalEnabled?: boolean
  thermalSensorOnline?: boolean
  thermalFrameAgeMs?: number | null
  thermalFps?: number | null
  thermalFrameWidth?: number | null
  thermalFrameHeight?: number | null
  minTemperatureC?: number | null
  maxTemperatureC?: number | null
  averageTemperatureC?: number | null
  thermalThresholdC?: number | null
  hotspotDetected?: boolean
  hotspotTemperatureC?: number | null
  thermalMode?: string | null
  thermalPixelFormat?: string | null
  thermalPalette?: string | null
  thermalIsothermEnabled?: boolean
  thermalDebugOverlayEnabled?: boolean
  thermalDisplayRangeMode?: string | null
  thermalDisplayMinC?: number | null
  thermalDisplayMaxC?: number | null
  thermalSourceError?: string | null
  lidar?: {
    enabled?: boolean
    available?: boolean
    status?: string
    direction?: string
    rangeMaxM?: number
    frontM?: number
    frontLeftM?: number
    frontRightM?: number
    leftM?: number
    rightM?: number
    backM?: number
    nearestM?: number
    nearestAngleDeg?: number
    nearestDirection?: string
    scanAgeS?: number | null
  }
}

export type MapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

export type RestrictedZone = {
  id: string
  code: string
  name: string
  coordinates: [number, number][]
}

export type GeofenceLevel =
  'UNKNOWN' | 'SAFE' | 'CAUTION' | 'DANGER' | 'VIOLATION'

export type GeofenceStatus = {
  level: GeofenceLevel
  zone?: RestrictedZone
  distanceM?: number
}

export type ControlsText = (typeof inFlightControlMessages)['vi']['controls']

export type WeatherText = (typeof inFlightControlMessages)['vi']['weather']

export type LidarDirection = 'FRONT' | 'LEFT' | 'RIGHT' | 'BACK'

export type LidarSeverity = 'CLEAR' | 'CAUTION' | 'DANGER' | 'UNKNOWN'

export type LidarDirectionState = {
  direction: LidarDirection
  value: number | null
  severity: LidarSeverity
  display: string
}

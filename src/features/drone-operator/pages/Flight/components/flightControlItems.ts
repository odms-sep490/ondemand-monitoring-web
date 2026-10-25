import type {
  FlightCommand,
  ControlsText,
  IconName,
  WeatherPreset,
  WeatherText,
} from '../inFlightTypes'

export const flightControls: {
  command: FlightCommand
  labelKey: keyof ControlsText
  icon: IconName
  tone?: 'danger' | 'amber'
}[] = [
  { command: 'takeoff', labelKey: 'takeoff', icon: 'takeoff' },
  {
    command: 'auto_plan_start',
    labelKey: 'autoPlan',
    icon: 'map',
    tone: 'amber',
  },
  { command: 'land', labelKey: 'land', icon: 'land' },
  {
    command: 'emergency_stop',
    labelKey: 'eStop',
    icon: 'alert',
    tone: 'danger',
  },
]

export const movementControls: {
  command: FlightCommand
  labelKey: keyof ControlsText
  icon: IconName
}[] = [
  { command: 'up', labelKey: 'ascend', icon: 'altitudeUp' },
  { command: 'forward', labelKey: 'forward', icon: 'moveForward' },
  { command: 'down', labelKey: 'descend', icon: 'altitudeDown' },
  { command: 'left', labelKey: 'left', icon: 'moveLeft' },
  { command: 'back', labelKey: 'back', icon: 'moveBack' },
  { command: 'right', labelKey: 'right', icon: 'moveRight' },
]

export const rotationControls: {
  command: FlightCommand
  labelKey: keyof ControlsText
  icon: IconName
}[] = [
  { command: 'yaw_left', labelKey: 'yawLeft', icon: 'rotateLeft' },
  { command: 'yaw_right', labelKey: 'yawRight', icon: 'rotateRight' },
  { command: 'speed_down', labelKey: 'speedDown', icon: 'minus' },
  { command: 'speed_up', labelKey: 'speedUp', icon: 'plus' },
]

export const moreToolControls: {
  command: FlightCommand
  labelKey: keyof ControlsText
  icon: IconName
}[] = [
  { command: 'camera_front', labelKey: 'camera', icon: 'camera' },
  { command: 'photo', labelKey: 'photo', icon: 'photo' },
  { command: 'video_toggle', labelKey: 'video', icon: 'video' },
  { command: 'lidar_monitor_toggle', labelKey: 'lidar', icon: 'radar' },
  {
    command: 'telemetry_monitor_toggle',
    labelKey: 'telemetry',
    icon: 'activity',
  },
  { command: 'safety_toggle', labelKey: 'safety', icon: 'shield' },
]

export const weatherControls: {
  preset: WeatherPreset
  labelKey: keyof WeatherText
  tone?: 'danger' | 'amber'
}[] = [
  { preset: 'CLEAR_DAY', labelKey: 'clear' },
  { preset: 'CLOUDY', labelKey: 'cloud' },
  { preset: 'FOGGY', labelKey: 'fog', tone: 'amber' },
  { preset: 'WINDY', labelKey: 'wind', tone: 'amber' },
  { preset: 'LIGHT_RAIN', labelKey: 'rain', tone: 'amber' },
  { preset: 'HEAVY_RAIN', labelKey: 'heavy', tone: 'danger' },
]

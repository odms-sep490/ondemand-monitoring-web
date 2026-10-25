import {
  standardLapseRateKPerM,
  standardTemperatureK,
  standardPressurePa,
  barometricExponent,
} from './inFlightConstants'

export const telemetryValue = (
  value: number | undefined,
  suffix: string,
  digits = 1,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(digits)} ${suffix}`
    : '--'

export const fmt = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export function formatNumber(value: number | null | undefined, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '--'
}

export function formatTemperature(value: number | null | undefined) {
  const formatted = formatNumber(value)
  return formatted === '--' ? '--' : `${formatted} °C`
}

export function pressureFromAltitude(altitudeM: number) {
  const ratio = 1 - (standardLapseRateKPerM * altitudeM) / standardTemperatureK
  if (ratio <= 0) return null
  return standardPressurePa * Math.pow(ratio, barometricExponent)
}

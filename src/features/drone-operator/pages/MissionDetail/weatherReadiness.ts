import type { WeatherPreflightStatus } from './types'

export const WEATHER_CHECK_MAX_AGE_MS = 15 * 60 * 1000

export function isWeatherCheckFresh(
  weather: WeatherPreflightStatus | null | undefined,
  now = Date.now(),
) {
  if (!weather?.checkedAt) return false
  const checkedAt = Date.parse(weather.checkedAt)
  return (
    Number.isFinite(checkedAt) &&
    checkedAt <= now &&
    now - checkedAt <= WEATHER_CHECK_MAX_AGE_MS
  )
}

export function isWeatherCheckFreshAfterPermit(
  weather: WeatherPreflightStatus | null | undefined,
  flightPermitUpdatedAt?: string | null,
  now = Date.now(),
) {
  if (!isWeatherCheckFresh(weather, now)) return false
  if (!flightPermitUpdatedAt) return true

  const permitUpdatedAt = Date.parse(flightPermitUpdatedAt)
  const checkedAt = Date.parse(weather!.checkedAt)
  return Number.isFinite(permitUpdatedAt) && checkedAt > permitUpdatedAt
}

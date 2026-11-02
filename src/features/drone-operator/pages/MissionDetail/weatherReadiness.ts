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

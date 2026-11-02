// Offline mock for `GET /api/weather/forecast` (ApiResponse envelope, same DTO as the BE).
// Deterministic by hour so every state can be seen without a backend:
//   Before 13:00 -> CAUTION (drizzle), 13:00-17:59 -> CAUTION, 18:00+ -> POOR (thunderstorm).
// A date more than 16 days away answers FORECAST_NOT_AVAILABLE, like the real service.
import type { WeatherForecast } from '../../features/customer/api/customerApi'
import { fail, isRealApiRoute, ok, passThrough, registerMockRoutes } from '../mockServer'

const DAY_MS = 86_400_000

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/weather/forecast',
    handler: ({ query }) => {
      // Hybrid mode (VITE_REAL_API_ROUTES) or an E2E interceptor: let the request leave the mock.
      if (isRealApiRoute('GET', '/api/weather/forecast')) return passThrough()
      const latitude = Number(query.get('latitude'))
      const longitude = Number(query.get('longitude'))
      const date = query.get('date') ?? ''
      const time = query.get('time') ?? ''
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) {
        return fail(400, 'INVALID_REQUEST', 'latitude is out of range')
      }
      if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        return fail(400, 'INVALID_REQUEST', 'longitude is out of range')
      }
      const hour = Number(time.slice(0, 2))
      const forecastTime = `${date}T${String(hour).padStart(2, '0')}:00`
      const days = (Date.parse(`${date}T00:00:00Z`) - Date.now()) / DAY_MS
      if (!Number.isFinite(days) || days > 16) {
        const unavailable: WeatherForecast = {
          status: 'FORECAST_NOT_AVAILABLE',
          latitude,
          longitude,
          forecastTime,
        }
        return ok(unavailable)
      }

      const forecast: WeatherForecast =
        hour >= 18
          ? {
              status: 'AVAILABLE', latitude, longitude, forecastTime,
              temperatureC: 27, relativeHumidityPercent: 88,
              precipitationProbabilityPercent: 85, precipitationMm: 4.2,
              windSpeedKmh: 38, windGustKmh: 52, cloudCoverPercent: 95,
              visibilityMeters: 6000, weatherCode: 95, weatherLabel: 'Dông',
              suitability: 'POOR', warnings: ['RAIN', 'WIND', 'GUST', 'THUNDERSTORM'],
            }
          : hour >= 13
            ? {
                status: 'AVAILABLE', latitude, longitude, forecastTime,
                temperatureC: 29, relativeHumidityPercent: 78,
                precipitationProbabilityPercent: 55, precipitationMm: 0.6,
                windSpeedKmh: 24, windGustKmh: 31, cloudCoverPercent: 70,
                visibilityMeters: 12000, weatherCode: 61, weatherLabel: 'Mưa nhẹ',
                suitability: 'CAUTION', warnings: ['RAIN', 'WIND', 'GUST'],
              }
            : {
                status: 'AVAILABLE', latitude, longitude, forecastTime,
                temperatureC: 30, relativeHumidityPercent: 70,
                precipitationProbabilityPercent: 10, precipitationMm: 0,
                windSpeedKmh: 8, windGustKmh: 12, cloudCoverPercent: 25,
                visibilityMeters: 24000, weatherCode: 51, weatherLabel: 'Mưa phùn',
                suitability: 'CAUTION', warnings: ['DRIZZLE'],
              }
      return ok(forecast)
    },
  },
])

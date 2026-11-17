import { useEffect, useState } from 'react'
import './DashboardWeather.css'

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m,weather_code&timezone=Asia%2FHo_Chi_Minh'

type WeatherResponse = {
  current?: {
    temperature_2m?: number
    weather_code?: number
  }
}

type WeatherReading = {
  temperature: number
  code?: number
}

function weatherSymbol(code?: number) {
  if (code === 0) return '☀️'
  if (code === 1 || code === 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code ?? -1)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return '🌨️'
  if ([95, 96, 99].includes(code ?? -1)) return '⛈️'
  return '🌤️'
}

/** Current conditions for Ho Chi Minh City, refreshed every ten minutes. */
export function DashboardWeather({ locale }: { locale: string }) {
  const [weather, setWeather] = useState<WeatherReading | null>(null)
  const isVietnamese = locale.toLowerCase().startsWith('vi')
  const city = isVietnamese ? 'TP.HCM' : 'Ho Chi Minh City'

  useEffect(() => {
    const controller = new AbortController()
    const loadWeather = async () => {
      try {
        const response = await fetch(WEATHER_URL, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Weather unavailable')
        const data = (await response.json()) as WeatherResponse
        const current = data.current
        const temperature = current?.temperature_2m
        if (!controller.signal.aborted) {
          setWeather(
            typeof temperature === 'number' && Number.isFinite(temperature)
              ? { temperature, code: current?.weather_code }
              : null,
          )
        }
      } catch {
        if (!controller.signal.aborted) setWeather(null)
      }
    }

    void loadWeather()
    const interval = window.setInterval(() => void loadWeather(), 10 * 60 * 1000)
    return () => {
      window.clearInterval(interval)
      controller.abort()
    }
  }, [])

  const value = weather === null
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(weather.temperature)

  return (
    <span
      className="mgr-dashboard-weather"
      aria-label={weather === null
        ? (isVietnamese ? `Chưa có dữ liệu thời tiết tại ${city}` : `Weather unavailable in ${city}`)
        : (isVietnamese
          ? `Thời tiết hiện tại tại ${city}: ${value} độ C`
          : `Current weather in ${city}: ${value} degrees Celsius`)}
      title={weather === null
        ? (isVietnamese ? 'Chưa tải được thời tiết' : 'Weather unavailable')
        : undefined}
    >
      <span className="mgr-dashboard-weather-icon" aria-hidden="true">
        {weatherSymbol(weather?.code)}
      </span>
      <span>{city} · {value}°C</span>
    </span>
  )
}

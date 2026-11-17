import { useEffect, useState } from 'react'
import './DashboardWeather.css'

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=10.8231&longitude=106.6297&current=temperature_2m&timezone=Asia%2FHo_Chi_Minh'

type WeatherResponse = {
  current?: {
    temperature_2m?: number
  }
}

/** Current modelled temperature for Ho Chi Minh City, refreshed every ten minutes. */
export function DashboardWeather({ locale }: { locale: string }) {
  const [temperature, setTemperature] = useState<number | null>(null)
  const isVietnamese = locale.toLowerCase().startsWith('vi')
  const city = isVietnamese ? 'TP.HCM' : 'Ho Chi Minh City'

  useEffect(() => {
    const controller = new AbortController()
    const loadWeather = async () => {
      try {
        const response = await fetch(WEATHER_URL, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('Weather unavailable')
        const data = (await response.json()) as WeatherResponse
        const value = data.current?.temperature_2m
        if (!controller.signal.aborted) {
          setTemperature(typeof value === 'number' && Number.isFinite(value) ? value : null)
        }
      } catch {
        if (!controller.signal.aborted) setTemperature(null)
      }
    }

    void loadWeather()
    const interval = window.setInterval(() => void loadWeather(), 10 * 60 * 1000)
    return () => {
      window.clearInterval(interval)
      controller.abort()
    }
  }, [])

  const value = temperature === null
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(temperature)

  return (
    <span
      className="mgr-dashboard-weather"
      aria-label={isVietnamese
        ? `Nhiệt độ hiện tại tại ${city}: ${value} độ C`
        : `Current temperature in ${city}: ${value} degrees Celsius`}
      title={temperature === null
        ? (isVietnamese ? 'Chưa tải được thời tiết' : 'Weather unavailable')
        : undefined}
    >
      <span aria-hidden="true">☀</span>
      <span>{city} · {value}°C</span>
    </span>
  )
}

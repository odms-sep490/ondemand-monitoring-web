import type { WeatherPreflightStatus } from '../types'

export function PrecheckWeatherResult({
  weather,
}: {
  weather: WeatherPreflightStatus | null
}) {
  const statusLabel = weather
    ? weather.safeToFly
      ? 'Đạt'
      : weather.status === 'WARN'
        ? 'Cảnh báo'
        : 'Không đạt'
    : 'Chưa check'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr auto',
        gap: 6,
        alignItems: 'center',
        padding: '8px 10px',
        marginBottom: 10,
        border: '1px solid var(--bd)',
        borderRadius: 7,
        background:
          weather?.status === 'FAIL'
            ? 'var(--red-bg)'
            : weather?.status === 'WARN'
              ? 'var(--yellow-bg)'
              : '#fff',
        fontSize: 12,
      }}
    >
      <span
        style={{
          fontWeight: 800,
          color:
            weather?.status === 'FAIL'
              ? 'var(--red-fg)'
              : weather?.status === 'WARN'
                ? 'var(--yellow-fg)'
                : weather
                  ? 'var(--green-fg)'
                  : 'var(--tx3)',
          fontSize: 13,
        }}
      >
        {weather?.status === 'FAIL' ? '✗' : weather ? '✓' : '○'}
      </span>
      <div>
        <div
          style={{
            fontWeight: 600,
            color: weather?.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx)',
          }}
        >
          Kết quả check thời tiết
        </div>
        <div
          style={{
            fontSize: 11,
            color: weather?.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx3)',
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 360,
          }}
          title={weather?.summary}
        >
          {weather
            ? `${weather.summary} · Gió ${weather.windSpeedMps.toFixed(1)} m/s · Tầm nhìn ${weather.visibilityKm.toFixed(1)} km`
            : 'Chưa có kết quả check thời tiết.'}
        </div>
      </div>
      <span
        style={{
          fontWeight: 700,
          fontSize: 11.5,
          color:
            weather?.status === 'FAIL'
              ? 'var(--red-fg)'
              : weather?.status === 'WARN'
                ? 'var(--yellow-fg)'
                : weather
                  ? 'var(--green-fg)'
                  : 'var(--tx3)',
          whiteSpace: 'nowrap',
        }}
      >
        {statusLabel}
      </span>
    </div>
  )
}

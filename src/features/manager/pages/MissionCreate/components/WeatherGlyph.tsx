export function WeatherGlyph({ code }: { code?: number }) {
  const rainy =
    code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
  const stormy = code != null && code >= 95
  const cloudy =
    code === 2 || code === 3 || code === 45 || code === 48 || rainy || stormy
  const sunny = !cloudy || code === 2
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {sunny ? (
        <g stroke="#f59e0b">
          <circle cx={cloudy ? 11 : 16} cy={cloudy ? 11 : 16} r="5" />
          {!cloudy ? (
            <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" />
          ) : null}
        </g>
      ) : null}
      {cloudy ? (
        <path
          stroke="#64748b"
          d="M10 24h13a5 5 0 0 0 .6-9.96A7 7 0 0 0 10 15a4.5 4.5 0 0 0 0 9z"
        />
      ) : null}
      {rainy ? (
        <path stroke="#3b82f6" d="M12 27l-1 2M17 27l-1 2M22 27l-1 2" />
      ) : null}
      {stormy ? <path stroke="#eab308" d="M17 20l-3 5h4l-2 4" /> : null}
    </svg>
  )
}

import { formatVnd } from '../../../../../../shared/lib/formatVnd'

type Props = {
  points: { date: string; received: number; refunded: number }[]
  locale: string
  days?: number
  bucket?: 'day' | 'week' | 'month'
  generatedAt?: string
  labels: { received: string; refunded: string; cumulative: string }
}

/** Fixed SVG coordinates keep the financial chart visible in flex and grid panels. */
export function CashFlowChart({
  points,
  locale,
  labels,
  days = 30,
  bucket = 'week',
  generatedAt,
}: Props) {
  const safeNumber = (value: unknown) =>
    Number.isFinite(Number(value)) ? Number(value) : 0
  const entries = new Map(
    points.map((point) => [point.date.slice(0, 10), point]),
  )
  const latest = [...entries.keys()].sort().at(-1)
  const anchor = generatedAt
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(generatedAt))
    : latest
  const end = new Date(
    `${anchor ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`,
  )
  const sorted = Array.from({ length: days }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(day.getUTCDate() - days + index + 1)
    const key = day.toISOString().slice(0, 10)
    const point = entries.get(key)
    return {
      date: key,
      received: safeNumber(point?.received),
      refunded: safeNumber(point?.refunded),
    }
  })
  const grouped = new Map<
    string,
    { date: string; received: number; refunded: number }
  >()
  for (const point of sorted) {
    const day = new Date(`${point.date}T00:00:00Z`)
    if (bucket === 'week')
      day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
    if (bucket === 'month') day.setUTCDate(1)
    const key = day.toISOString().slice(0, 10)
    const current = grouped.get(key) ?? { date: key, received: 0, refunded: 0 }
    current.received += point.received
    current.refunded += point.refunded
    grouped.set(key, current)
  }
  let balance = 0
  const rows = [...grouped.values()].map((point) => ({
    ...point,
    balance: (balance += point.received - point.refunded),
  }))
  const low = Math.min(0, ...rows.map((p) => Math.min(p.refunded, p.received)))
  const high = Math.max(1, ...rows.map((p) => Math.max(p.received, p.refunded)))
  const y = (value: number) => 24 + ((high - value) / (high - low)) * 210
  const step = 620 / Math.max(rows.length, 1)
  const x = (index: number) => 70 + step * (index + 0.5)
  const money = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(value))
  return (
    <div className="mgr-cash-combo">
      <p className="mgr-cash-combo-key">
        <span>{labels.received}</span>
        <span>{labels.refunded}</span>
      </p>
      <svg
        viewBox="0 0 720 280"
        role="img"
        aria-label={`${labels.cumulative}: ${formatVnd(balance)}`}
        style={{
          display: 'block',
          width: '100%',
          height: 360,
          minHeight: 300,
        }}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const value = low + ((high - low) * index) / 4
          return (
            <g key={index}>
              <line
                x1="70"
                x2="690"
                y1={y(value)}
                y2={y(value)}
                stroke="var(--mgr-border, #e6ecf5)"
                strokeDasharray="4 5"
              />
              <text
                x="60"
                y={y(value) + 4}
                textAnchor="end"
                fill="var(--mgr-muted, #64748b)"
                fontSize="11"
              >
                {money.format(value)}
              </text>
            </g>
          )
        })}
        <line
          x1="70"
          x2="690"
          y1={y(0)}
          y2={y(0)}
          stroke="var(--mgr-muted, #64748b)"
        />
        {rows.map((row, index) =>
          index % Math.max(1, Math.ceil(rows.length / 7)) === 0 ||
          index === rows.length - 1 ? (
            <text
              key={row.date}
              x={x(index)}
              y="263"
              textAnchor="middle"
              fill="var(--mgr-muted, #64748b)"
              fontSize="11"
            >
              {date(row.date)}
            </text>
          ) : null,
        )}
        {rows.map((row, index) => {
          const barWidth = Math.min(42, step * 0.38)
          return (
            <g key={`bars-${row.date}`}>
              {(
                [
                  { key: 'received', label: labels.received, color: '#1565e8' },
                  { key: 'refunded', label: labels.refunded, color: '#d97706' },
                ] as const
              ).map((series, seriesIndex) => {
                const value = row[series.key]
                return (
                  <rect
                    key={series.key}
                    x={x(index) + (seriesIndex - 1) * barWidth}
                    y={y(Math.max(0, value))}
                    width={Math.max(1, barWidth - 1)}
                    height={Math.abs(y(value) - y(0))}
                    rx="2"
                    fill={series.color}
                    style={{ animation: 'none' }}
                  >
                    <title>
                      {date(row.date)} · {series.label}: {formatVnd(value)}
                    </title>
                  </rect>
                )
              })}
            </g>
          )
        })}
        {rows.length === 1 && (
          <text
            x={x(0)}
            y="14"
            textAnchor="middle"
            fill="var(--mgr-text)"
            fontSize="11"
          >
            {labels.received}: {formatVnd(rows[0].received)} · {labels.refunded}
            : {formatVnd(rows[0].refunded)}
          </text>
        )}
      </svg>
    </div>
  )
}

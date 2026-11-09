import { useEffect, useId, useRef } from 'react'
import { useDeadline } from '../useDeadline'

const CLOCK_CENTER = 120
const RING_CIRCUMFERENCE = 2 * Math.PI * 111

type CountdownUnit = {
  value: string
  label: string
}

function getCountdownUnits(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const totalHours = Math.floor(totalSeconds / 3600)
  const days = Math.floor(totalHours / 24)
  const hours = days > 0 ? totalHours % 24 : totalHours
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

export function DeadlineCountdown({
  expired = false,
  label,
  deadline,
  startAt,
  deadlineLabel,
  dayLabel,
  hourLabel,
  minuteLabel,
  secondLabel,
  clockLabel,
  onExpire,
}: {
  expired?: boolean
  label: string
  deadline: string
  startAt?: string | null
  deadlineLabel: string
  dayLabel: string
  hourLabel: string
  minuteLabel: string
  secondLabel: string
  clockLabel: string
  onExpire?: () => void
}) {
  const gradientId = `deadline-face-${useId().replace(/:/g, '')}`
  const hourHandRef = useRef<SVGLineElement>(null)
  const minuteHandRef = useRef<SVGLineElement>(null)
  const secondHandRef = useRef<SVGLineElement>(null)
  const deadlineTimestamp = Date.parse(deadline)
  const { expired: reachedDeadline, remainingMs } = useDeadline(
    deadline,
    onExpire,
  )
  const startedAt = startAt ? Date.parse(startAt) : Number.NaN
  const hasProgressWindow =
    Number.isFinite(startedAt) &&
    Number.isFinite(deadlineTimestamp) &&
    deadlineTimestamp > startedAt
  const progress = hasProgressWindow
    ? Math.max(
        0,
        Math.min(1, (Date.now() - startedAt) / (deadlineTimestamp - startedAt)),
      )
    : null
  const isExpired = expired || reachedDeadline
  const units = getCountdownUnits(isExpired ? 0 : (remainingMs ?? 0))
  const visibleUnits: CountdownUnit[] = [
    ...(units.days > 0
      ? [{ value: String(units.days).padStart(2, '0'), label: dayLabel }]
      : []),
    { value: String(units.hours).padStart(2, '0'), label: hourLabel },
    { value: String(units.minutes).padStart(2, '0'), label: minuteLabel },
    { value: String(units.seconds).padStart(2, '0'), label: secondLabel },
  ]

  useEffect(() => {
    let animationFrame = 0
    let reducedMotionTimer = 0
    let disposed = false
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    const updateHands = () => {
      if (disposed) return
      const now = new Date()
      const milliseconds = now.getMilliseconds()
      const seconds = now.getSeconds() + milliseconds / 1000
      const minutes = now.getMinutes() + seconds / 60
      const hours = (now.getHours() % 12) + minutes / 60
      hourHandRef.current?.setAttribute(
        'transform',
        `rotate(${hours * 30} ${CLOCK_CENTER} ${CLOCK_CENTER})`,
      )
      minuteHandRef.current?.setAttribute(
        'transform',
        `rotate(${minutes * 6} ${CLOCK_CENTER} ${CLOCK_CENTER})`,
      )
      secondHandRef.current?.setAttribute(
        'transform',
        `rotate(${seconds * 6} ${CLOCK_CENTER} ${CLOCK_CENTER})`,
      )
    }

    const stop = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      if (reducedMotionTimer) window.clearInterval(reducedMotionTimer)
      animationFrame = 0
      reducedMotionTimer = 0
    }

    const start = () => {
      stop()
      updateHands()
      if (document.visibilityState === 'hidden') return
      if (motionPreference.matches) {
        reducedMotionTimer = window.setInterval(updateHands, 1000)
        return
      }
      const animate = () => {
        updateHands()
        animationFrame = window.requestAnimationFrame(animate)
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }
    const handleMotionChange = () => start()

    start()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionPreference.addEventListener('change', handleMotionChange)
    return () => {
      disposed = true
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionPreference.removeEventListener('change', handleMotionChange)
    }
  }, [])

  const ticks = Array.from({ length: 60 }, (_, index) => {
    const major = index % 5 === 0
    const angle = ((index * 6 - 90) * Math.PI) / 180
    const outerRadius = 91
    const innerRadius = major ? 81 : 86
    return {
      key: index,
      major,
      x1: CLOCK_CENTER + Math.cos(angle) * innerRadius,
      y1: CLOCK_CENTER + Math.sin(angle) * innerRadius,
      x2: CLOCK_CENTER + Math.cos(angle) * outerRadius,
      y2: CLOCK_CENTER + Math.sin(angle) * outerRadius,
    }
  })

  return (
    <section
      className={`customer-deadline-countdown${isExpired ? ' is-expired' : ''}`}
      role="timer"
      aria-live="off"
      aria-description={clockLabel}
      aria-label={`${label}: ${visibleUnits.map((unit) => `${unit.value} ${unit.label}`).join(' ')}`}
    >
      <h3 className="customer-deadline-countdown-label">{label}</h3>
      <div className="customer-deadline-clock" aria-hidden="true">
        <svg viewBox="0 0 240 240" focusable="false">
          <defs>
            <radialGradient id={gradientId} cx="36%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="72%" stopColor="#f8fbff" />
              <stop offset="100%" stopColor="#e9f2ff" />
            </radialGradient>
          </defs>
          {progress == null ? null : (
            <>
              <circle
                className="customer-deadline-ring-track"
                cx={CLOCK_CENTER}
                cy={CLOCK_CENTER}
                r="111"
              />
              <circle
                className="customer-deadline-ring-progress"
                cx={CLOCK_CENTER}
                cy={CLOCK_CENTER}
                r="111"
                style={{
                  strokeDasharray: RING_CIRCUMFERENCE,
                  strokeDashoffset:
                    RING_CIRCUMFERENCE * (1 - (isExpired ? 1 : progress)),
                }}
              />
            </>
          )}
          <circle
            className="customer-deadline-clock-face"
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r="96"
            fill={`url(#${gradientId})`}
          />
          {ticks.map((tick) => (
            <line
              key={tick.key}
              className={`customer-deadline-clock-tick${tick.major ? ' is-major' : ''}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
            />
          ))}
          <g className="customer-deadline-clock-numerals">
            <text x="120" y="57">
              12
            </text>
            <text x="184" y="125">
              3
            </text>
            <text x="120" y="193">
              6
            </text>
            <text x="56" y="125">
              9
            </text>
          </g>
          <line
            ref={hourHandRef}
            className="customer-deadline-clock-hand is-hour"
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 8}
            x2={CLOCK_CENTER}
            y2={CLOCK_CENTER - 43}
          />
          <line
            ref={minuteHandRef}
            className="customer-deadline-clock-hand is-minute"
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 8}
            x2={CLOCK_CENTER}
            y2={CLOCK_CENTER - 64}
          />
          <line
            ref={secondHandRef}
            className="customer-deadline-clock-hand is-second"
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER + 12}
            x2={CLOCK_CENTER}
            y2={CLOCK_CENTER - 75}
          />
          <circle
            className="customer-deadline-clock-pin"
            cx={CLOCK_CENTER}
            cy={CLOCK_CENTER}
            r="6"
          />
        </svg>
      </div>
      <div
        className={`customer-deadline-units${units.days > 0 ? ' has-days' : ''}`}
        aria-hidden="true"
      >
        {visibleUnits.map((unit) => (
          <div className="customer-deadline-unit" key={unit.label}>
            <strong>{unit.value}</strong>
            <span>{unit.label}</span>
          </div>
        ))}
      </div>
      <small className="customer-deadline-date">
        <time dateTime={deadline}>{deadlineLabel}</time>
      </small>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { runtimePreflightCheckMessages } from '../i18n/runtimePreflightCheck'
import { humanizePreflightDisplayText } from '../../pages/Preflight/preflightHelpers'

type PreflightItemStatus = 'PENDING' | 'CHECKING' | 'PASS' | 'WARN' | 'FAIL'
type PreflightOverallStatus = 'CHECKING' | 'READY' | 'FAILED'

type PreflightItem = {
  key: string
  name: string
  status: PreflightItemStatus
  message: string
  critical: boolean
}

type PreflightStatus = {
  checkId: string
  status: PreflightOverallStatus
  progress: number
  checks: PreflightItem[]
  updatedAt?: string
}

const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

const PENDING_CHECK_KEYS: [string, boolean][] = [
  ['PX4', true],
  ['MAVSDK', true],
  ['PX4_CONTROL', true],
  ['MAVSDK_HEALTH', true],
  ['BATTERY', true],
  ['LIDAR', false],
  ['CAMERA', false],
  ['BACKEND', false],
  ['MEDIA', false],
  ['MODULES', false],
]

const HIDDEN_CHECK_KEYS = new Set(['GAZEBO', 'LOCAL_POSITION'])

function statusColor(status: PreflightItemStatus) {
  if (status === 'PASS') return '#4ade80'
  if (status === 'WARN') return '#fbbf24'
  if (status === 'FAIL') return '#f87171'
  if (status === 'CHECKING') return '#60a5fa'
  return '#64748b'
}

function statusMark(status: PreflightItemStatus) {
  if (status === 'PASS') return '✓'
  if (status === 'WARN') return '!'
  if (status === 'FAIL') return '×'
  if (status === 'CHECKING') return '◌'
  return '•'
}

export default function RuntimePreflightCheck({
  onReady,
}: {
  onReady: () => void | Promise<void>
}) {
  const { t } = useI18n(runtimePreflightCheckMessages)

  function statusLabel(status: PreflightItemStatus) {
    if (status === 'PASS') return t.statusOk
    if (status === 'WARN') return t.statusWarn
    if (status === 'FAIL') return t.statusFail
    if (status === 'CHECKING') return t.statusChecking
    return t.statusPending
  }

  const pendingChecks: PreflightItem[] = PENDING_CHECK_KEYS.map(
    ([key, critical]) => ({
      key,
      name:
        t.checkNames[key as keyof typeof t.checkNames] ??
        humanizePreflightDisplayText(key),
      critical,
      status: 'PENDING',
      message: t.pending,
    }),
  )

  const waitingForControllerChecks = pendingChecks.map((item) => ({
    ...item,
    status: 'CHECKING' as const,
    message: t.waitingForController,
  }))

  const [checkId, setCheckId] = useState<string | null>(null)
  const [status, setStatus] = useState<PreflightStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrySeed, setRetrySeed] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  async function continuePreflight() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onReady()
    } catch (cause) {
      setError(
        humanizePreflightDisplayText(
          cause instanceof Error ? cause.message : t.backendPreflightFailed,
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const checks = (status?.checks?.length ? status.checks : pendingChecks).filter(
    (item) => !HIDDEN_CHECK_KEYS.has(item.key),
  )
  const passedCount = checks.filter((item) => item.status === 'PASS').length
  const failedCount = checks.filter((item) => item.status === 'FAIL').length
  const finishedCount = checks.filter((item) =>
    ['PASS', 'WARN', 'FAIL'].includes(item.status),
  ).length
  const allVisiblePassed =
    checks.length > 0 && passedCount === checks.length && failedCount === 0
  const effectiveStatus: PreflightOverallStatus = allVisiblePassed
    ? 'READY'
    : failedCount > 0
      ? 'FAILED'
      : status?.status ?? 'CHECKING'
  const progress = allVisiblePassed
    ? 100
    : status?.progress ?? Math.round((finishedCount / checks.length) * 100)
  const ready = effectiveStatus === 'READY'
  const failed = effectiveStatus === 'FAILED'
  const okEnabled = ready
  const visibleReady = ready && displayProgress >= 100
  const visibleFailed = failed && displayProgress >= progress
  const criticalFailures = useMemo(
    () => checks.filter((item) => item.critical && item.status === 'FAIL'),
    [checks],
  )

  useEffect(() => {
    let alive = true
    let retryTimer: number | undefined

    async function startPreflight() {
      setError(null)
      setStatus({
        checkId: 'connecting',
        status: 'CHECKING',
        progress: 0,
        checks: waitingForControllerChecks,
      })
      setCheckId(null)
      try {
        const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error(t.preflightApiError(response.status))
        const payload = await response.json()
        if (!alive) return
        setCheckId(payload.checkId)
      } catch {
        if (!alive) return
        setError(t.waitingForControllerApi)
        setStatus({
          checkId: 'connecting',
          status: 'CHECKING',
          progress: 0,
          checks: waitingForControllerChecks,
        })
        retryTimer = window.setTimeout(startPreflight, 1500)
      }
    }

    void startPreflight()
    return () => {
      alive = false
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [retrySeed])

  useEffect(() => {
    if (!checkId || checkId === 'offline') return
    let alive = true

    async function poll() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${checkId}`,
          { cache: 'no-store' },
        )
        if (!response.ok)
          throw new Error(t.preflightStatusError(response.status))
        const payload = await response.json()
        if (!alive) return
        setStatus(payload)
      } catch {
        if (!alive) return
        setError(t.statusUnavailable)
        setCheckId(null)
        setRetrySeed((value) => value + 1)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId])

  useEffect(() => {
    if (!checkId) {
      setDisplayProgress(0)
      return
    }

    const timer = window.setInterval(() => {
      setDisplayProgress((value) => {
        const target = Math.max(1, progress)
        if (value < target) return Math.min(target, value + 1)
        if (value > target) return target
        return value
      })
    }, 35)

    return () => window.clearInterval(timer)
  }, [checkId, progress])

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '18px 20px 72px',
        background:
          'radial-gradient(circle at top,#0f2744 0,#071324 38%,#020617 100%)',
        color: '#e5edf8',
        overflow: 'visible',
      }}
    >
      <section
        style={{
          width: 'min(860px, 100%)',
          maxHeight: 'calc(100vh - 210px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,.2)',
          background: 'rgba(8,13,24,.82)',
          boxShadow: '0 24px 80px rgba(0,0,0,.34)',
          backdropFilter: 'blur(14px)',
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(37,99,235,.2)',
              border: '1px solid rgba(96,165,250,.34)',
              color: '#93c5fd',
              fontSize: 22,
            }}
          >
            ◇
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0 }}>
              {t.title}
            </h1>
            <p style={{ margin: '3px 0 0', color: '#9fb0c7', fontSize: 13 }}>
              {t.description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 999,
              background: 'rgba(30,41,59,.9)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${displayProgress}%`,
                height: '100%',
                borderRadius: 999,
                background: visibleFailed
                  ? '#ef4444'
                  : 'linear-gradient(90deg,#16a34a,#22c55e)',
                transition: 'width .18s ease',
              }}
            />
          </div>
          <strong
            style={{
              minWidth: 48,
              textAlign: 'right',
              color: visibleFailed ? '#fca5a5' : '#4ade80',
              fontFamily: 'var(--font-data)',
            }}
          >
            {displayProgress}%
          </strong>
        </div>

        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid ${visibleReady ? 'rgba(74,222,128,.28)' : visibleFailed ? 'rgba(248,113,113,.28)' : 'rgba(96,165,250,.24)'}`,
            background: visibleReady
              ? 'rgba(22,101,52,.16)'
              : visibleFailed
                ? 'rgba(127,29,29,.18)'
                : 'rgba(30,64,175,.14)',
          }}
        >
          <strong
            style={{
              color: visibleReady
                ? '#86efac'
                : visibleFailed
                  ? '#fecaca'
                  : '#bfdbfe',
              fontSize: 13,
            }}
          >
            {visibleReady
              ? t.completed
              : visibleFailed
                ? t.failedBanner
                : t.checking}
          </strong>
          <div style={{ marginTop: 3, color: '#cbd5e1', fontSize: 12 }}>
            {visibleReady
              ? t.readyBody
              : visibleFailed
                ? t.failedBody
                : t.checkingBody}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(148,163,184,.16)',
            borderRadius: 14,
            overflow: 'auto',
            marginBottom: 12,
            minHeight: 0,
          }}
        >
          {checks.map((item, index) => (
            <div
              key={item.key}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '26px minmax(170px,1fr) 74px minmax(200px,1.2fr) 68px',
                gap: 8,
                alignItems: 'center',
                padding: '7px 10px',
                borderTop: index === 0 ? 0 : '1px solid rgba(148,163,184,.12)',
                background: item.critical
                  ? 'rgba(15,23,42,.36)'
                  : 'rgba(15,23,42,.18)',
              }}
            >
              <span
                style={{ color: statusColor(item.status), fontWeight: 900 }}
              >
                {statusMark(item.status)}
              </span>
              <strong style={{ fontSize: 12 }}>
                {humanizePreflightDisplayText(item.name)}
              </strong>
              <span
                style={{
                  color: statusColor(item.status),
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                {statusLabel(item.status)}
              </span>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>
                {humanizePreflightDisplayText(item.message)}
              </span>
              <span
                style={{
                  justifySelf: 'end',
                  padding: '2px 6px',
                  borderRadius: 999,
                  fontSize: 8,
                  fontWeight: 900,
                  color: item.critical ? '#fecaca' : '#bae6fd',
                  background: item.critical
                    ? 'rgba(127,29,29,.2)'
                    : 'rgba(14,116,144,.16)',
                }}
              >
                {item.critical ? t.critical : t.optional}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 10, color: '#fca5a5', fontSize: 12 }}>
            {error}
          </div>
        )}
        {criticalFailures.length > 0 && (
          <div style={{ marginBottom: 10, color: '#fecaca', fontSize: 12 }}>
            {criticalFailures
              .map((item) => `${item.name}: ${item.message}`)
              .join(' | ')}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {failed && (
            <button
              onClick={() => setRetrySeed((value) => value + 1)}
              style={{
                height: 42,
                padding: '0 16px',
                borderRadius: 11,
                border: '1px solid rgba(96,165,250,.3)',
                background: 'rgba(15,23,42,.78)',
                color: '#bfdbfe',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {t.retryFailedChecks}
            </button>
          )}
          <button
            disabled={!okEnabled || submitting}
            onClick={() => void continuePreflight()}
            style={{
              height: 42,
              padding: '0 18px',
              borderRadius: 11,
              border: '1px solid rgba(34,197,94,.35)',
              background: okEnabled
                ? 'linear-gradient(90deg,#15803d,#16a34a)'
                : 'rgba(30,41,59,.7)',
              color: okEnabled ? '#ecfdf5' : '#64748b',
              fontWeight: 950,
              cursor: okEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            {t.goToOperator}
          </button>
        </div>
      </section>
    </div>
  )
}

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RocketOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { managerHref, type ManagerRoute } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'

export type DashboardKpiAvailability = {
  pendingReview: boolean
  waitingQuote: boolean
  waitingDeposit: boolean
  activeMissions: boolean
  completed: boolean
}

type KpiAccent = 'amber' | 'indigo' | 'orange' | 'blue' | 'emerald'

/** Smooth count-up interpolation that respects prefers-reduced-motion and always lands on exact value. */
function useAnimatedNumber(target: number, enabled: boolean): number {
  const [display, setDisplay] = useState(target)
  const previousRef = useRef(target)

  useEffect(() => {
    if (!enabled) {
      previousRef.current = target
      setDisplay(target)
      return
    }
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || previousRef.current === target) {
      previousRef.current = target
      setDisplay(target)
      return
    }

    const from = previousRef.current
    const delta = target - from
    const duration = 420
    const start = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + delta * eased))
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick)
      } else {
        previousRef.current = target
        setDisplay(target)
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [target, enabled])

  return display
}

function KpiLink({
  route,
  title,
  value,
  available,
  unavailableLabel,
  icon,
  accent,
}: {
  route: ManagerRoute
  title: string
  value: number
  available: boolean
  unavailableLabel: string
  icon: ReactNode
  accent: KpiAccent
}) {
  const animated = useAnimatedNumber(value, available)

  return (
    <a
      className={`mgr-dash-kpi is-accent-${accent}`}
      href={managerHref(route)}
      aria-label={`${title}: ${available ? value.toLocaleString() : unavailableLabel}`}
    >
      <span className={`mgr-kpi-icon is-${accent}`} aria-hidden="true">
        {icon}
      </span>
      <span className="mgr-kpi-copy">
        <span className="mgr-kpi-label">{title}</span>
        <strong className="mgr-kpi-value" aria-hidden="true">
          {available ? animated.toLocaleString() : '—'}
        </strong>
      </span>
    </a>
  )
}

export function KpiRow({
  data,
  availability,
}: {
  data: ManagerDashboardData
  availability: DashboardKpiAvailability
}) {
  const { t } = useI18n(dashboardPageMessages)
  const s = data.summary
  const p = data.pricingPipeline
  const completed = data.missionTrend.reduce(
    (sum, point) => sum + point.completed,
    0,
  )
  const queue: ManagerRoute = { screen: 'orderQueue' }
  const missions: ManagerRoute = { screen: 'missions' }

  return (
    <section className="mgr-kpi-grid" aria-label={t.kpi.overviewLabel}>
      <KpiLink
        route={queue}
        title={t.kpi.pendingReview}
        value={s.pendingOrderCount}
        available={availability.pendingReview}
        unavailableLabel={t.kpi.unavailable}
        icon={<ClockCircleOutlined />}
        accent="amber"
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingQuote}
        value={p.pricingReviewCount + p.quoteReadyCount}
        available={availability.waitingQuote}
        unavailableLabel={t.kpi.unavailable}
        icon={<FileTextOutlined />}
        accent="indigo"
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingDeposit}
        value={s.waitingDepositCount}
        available={availability.waitingDeposit}
        unavailableLabel={t.kpi.unavailable}
        icon={<WalletOutlined />}
        accent="orange"
      />
      <KpiLink
        route={missions}
        title={t.kpi.activeMissions}
        value={s.activeMissionCount}
        available={availability.activeMissions}
        unavailableLabel={t.kpi.unavailable}
        icon={<RocketOutlined />}
        accent="blue"
      />
      <KpiLink
        route={missions}
        title={t.kpi.completed}
        value={completed}
        available={availability.completed}
        unavailableLabel={t.kpi.unavailable}
        icon={<CheckCircleOutlined />}
        accent="emerald"
      />
    </section>
  )
}

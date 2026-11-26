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
  hint,
  available,
  unavailableLabel,
  icon,
  accent,
}: {
  route: ManagerRoute
  title: string
  value: number
  hint: string
  available: boolean
  unavailableLabel: string
  icon: ReactNode
  accent: KpiAccent
}) {
  const animated = useAnimatedNumber(value, available)

  return (
    <a
      className={`mgr-dash-kpi mgr-deck-tile is-accent-${accent}`}
      href={managerHref(route)}
      aria-label={`${title}: ${available ? value.toLocaleString() : unavailableLabel}`}
    >
      <span className="mgr-deck-tile-head">
        <span className="mgr-kpi-label">{title}</span>
        <span className={`mgr-kpi-icon is-${accent}`} aria-hidden="true">
          {icon}
        </span>
      </span>
      <strong className="mgr-kpi-value" aria-hidden="true">
        {available ? animated.toLocaleString() : '—'}
      </strong>
      <span className="mgr-deck-tile-foot">
        <span className={`mgr-deck-pill is-${accent}`}>{hint}</span>
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
  const { t, lang } = useI18n(dashboardPageMessages)
  const vi = lang === 'vi'
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
        hint={vi ? 'Đơn cần duyệt' : 'Orders to review'}
        available={availability.pendingReview}
        unavailableLabel={t.kpi.unavailable}
        icon={<ClockCircleOutlined />}
        accent="amber"
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingQuote}
        value={p.pricingReviewCount + p.quoteReadyCount}
        hint={vi ? 'Đang xử lý báo giá' : 'Pricing pipeline'}
        available={availability.waitingQuote}
        unavailableLabel={t.kpi.unavailable}
        icon={<FileTextOutlined />}
        accent="indigo"
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingDeposit}
        value={s.waitingDepositCount}
        hint={vi ? 'Chờ thanh toán cọc' : 'Awaiting deposit'}
        available={availability.waitingDeposit}
        unavailableLabel={t.kpi.unavailable}
        icon={<WalletOutlined />}
        accent="orange"
      />
      <KpiLink
        route={missions}
        title={t.kpi.activeMissions}
        value={s.activeMissionCount}
        hint={vi ? 'Nhiệm vụ đang chạy' : 'Active flights'}
        available={availability.activeMissions}
        unavailableLabel={t.kpi.unavailable}
        icon={<RocketOutlined />}
        accent="blue"
      />
      <KpiLink
        route={missions}
        title={t.kpi.completed}
        value={completed}
        hint={vi ? 'Hoàn tất trong kỳ' : 'Completed in range'}
        available={availability.completed}
        unavailableLabel={t.kpi.unavailable}
        icon={<CheckCircleOutlined />}
        accent="emerald"
      />
    </section>
  )
}

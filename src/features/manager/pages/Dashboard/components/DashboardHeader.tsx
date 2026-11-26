import {
  CalendarOutlined,
  CompassOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { DashboardWeather } from './DashboardWeather'

export type DashboardRange = '7D' | '30D' | '90D'
const RANGES: DashboardRange[] = ['7D', '30D', '90D']

type Props = {
  subtitle: string
  range: DashboardRange
  pendingCount: number
  pendingCountAvailable: boolean
  onRangeChange: (range: DashboardRange) => void
  onRefresh: () => void
}

/** Deep-navy telemetry command masthead synchronized with Resource Lifecycle & Maintenance. */
export function DashboardHeader({
  subtitle,
  range,
  pendingCount,
  pendingCountAvailable,
  onRangeChange,
  onRefresh,
}: Props) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)

  return (
    <header className="mgr-dash-header mgr-dash-deck-hero">
      <div className="mgr-dash-heading">
        <div className="mgr-dash-eyebrow-row">
          <p className="mgr-dash-date">
            <span>{today}</span>
            <DashboardWeather locale={locale} />
          </p>
        </div>
        <h1 className="mgr-hero-title">{t.title}</h1>
        <p className="mgr-hero-greet">
          {pendingCountAvailable
            ? t.hero.summary(pendingCount)
            : t.hero.summaryUnavailable}
        </p>
        <nav className="mgr-dash-shortcuts" aria-label={t.hero.shortcutsLabel}>
          <Button
            type="primary"
            icon={<FileSearchOutlined aria-hidden="true" />}
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.hero.reviewOrders}
          </Button>
          <Button
            className="mgr-deck-ghost-btn"
            icon={<CompassOutlined aria-hidden="true" />}
            href={managerHref({ screen: 'missions' })}
          >
            {t.hero.viewMissions}
          </Button>
          <Button
            className="mgr-deck-ghost-btn"
            icon={<CalendarOutlined aria-hidden="true" />}
            href={managerHref({ screen: 'schedule', calendar: true })}
          >
            {t.hero.viewSchedule}
          </Button>
        </nav>
      </div>

      <div className="mgr-dash-controls">
        <div className="mgr-dash-control-row">
          <div
            role="group"
            aria-label={t.rangeLabel}
            className="mgr-deck-range"
          >
            {RANGES.map((value) => {
              const active = range === value
              return (
                <button
                  key={value}
                  type="button"
                  className={`mgr-deck-range-btn${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onRangeChange(value)}
                >
                  {t.ranges[value]}
                </button>
              )
            })}
          </div>
          <Button
            className="mgr-deck-ghost-btn"
            icon={<ReloadOutlined aria-hidden="true" />}
            onClick={onRefresh}
          >
            {t.refresh}
          </Button>
        </div>
        <p className="mgr-hero-updated">{subtitle}</p>
      </div>
    </header>
  )
}

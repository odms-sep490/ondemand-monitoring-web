import { ReloadOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { DashboardWeather } from './DashboardWeather'
import '../../../../../shared/components/pageBanner.css'

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

/** Compact operations heading with the dashboard's live period controls. */
export function DashboardHeader({ subtitle, range, pendingCount, pendingCountAvailable, onRangeChange, onRefresh }: Props) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)

  return (
    <header className="mgr-dash-header app-page-banner">
      <div className="mgr-dash-heading">
        <p className="mgr-dash-date">{today}<DashboardWeather locale={locale} /></p>
        <h1 className="mgr-hero-title">{t.title}</h1>
        <p className="mgr-hero-greet">
          {pendingCountAvailable
            ? t.hero.summary(pendingCount)
            : t.hero.summaryUnavailable}
        </p>
        <nav className="mgr-dash-shortcuts" aria-label={t.hero.shortcutsLabel}>
          <Button
            type="primary"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.hero.reviewOrders}
          </Button>
          <Button ghost href={managerHref({ screen: 'missions' })}>
            {t.hero.viewMissions}
          </Button>
          <Button ghost href={managerHref({ screen: 'schedule', calendar: true })}>
            {t.hero.viewSchedule}
          </Button>
        </nav>
      </div>

      <div className="mgr-dash-controls">
        <div className="mgr-dash-control-row">
          <div role="group" aria-label={t.rangeLabel} className="mgr-hero-range">
            <Space.Compact>
              {RANGES.map((value) => (
                <Button
                  key={value}
                  type={range === value ? 'primary' : 'default'}
                  aria-pressed={range === value}
                  onClick={() => onRangeChange(value)}
                >
                  {t.ranges[value]}
                </Button>
              ))}
            </Space.Compact>
          </div>
          <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={onRefresh}>
            {t.refresh}
          </Button>
        </div>
        <p className="mgr-hero-updated">{subtitle}</p>

      </div>
    </header>
  )
}

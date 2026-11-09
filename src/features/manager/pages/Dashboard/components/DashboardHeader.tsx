import { CalendarOutlined, ReloadOutlined, RocketOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'

export type DashboardRange = '7D' | '30D' | '90D'
const RANGES: DashboardRange[] = ['7D', '30D', '90D']

type Props = {
  subtitle: string
  range: DashboardRange
  pendingCount: number
  onRangeChange: (range: DashboardRange) => void
  onRefresh: () => void
}

/** Compact operations heading with the dashboard's live period controls. */
export function DashboardHeader({ subtitle, range, pendingCount, onRangeChange, onRefresh }: Props) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const now = new Date()
  const today = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)

  return (
    <header className="mgr-dash-header">
      <div className="mgr-dash-heading">
        <p className="mgr-dash-date"><CalendarOutlined aria-hidden="true" /> {today}</p>
        <h1 className="mgr-hero-title">{t.title}</h1>
        <p className="mgr-hero-greet">{t.hero.summary(pendingCount)}</p>
        <nav className="mgr-dash-shortcuts" aria-label={t.hero.shortcutsLabel}>
          <Button
            type="primary"
            icon={<FileSearchOutlined aria-hidden="true" />}
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.hero.reviewOrders}
          </Button>
          <Button icon={<RocketOutlined aria-hidden="true" />} href={managerHref({ screen: 'missions' })}>
            {t.hero.viewMissions}
          </Button>
          <Button icon={<CalendarOutlined aria-hidden="true" />} href={managerHref({ screen: 'schedule' })}>
            {t.hero.viewSchedule}
          </Button>
        </nav>
      </div>

      <div className="mgr-dash-controls">
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
        <p className="mgr-hero-updated">{subtitle}</p>
      </div>
    </header>
  )
}

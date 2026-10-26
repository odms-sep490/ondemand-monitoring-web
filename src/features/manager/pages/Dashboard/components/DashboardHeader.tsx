import { CalendarOutlined, ReloadOutlined, RocketOutlined, FileSearchOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { authSession } from '../../../../auth/api/authApi'
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

function firstName(fullName: string | undefined) {
  const words = fullName?.trim().split(/\s+/) ?? []
  return words.length ? words[words.length - 1] : ''
}

/** Welcome banner: greeting, date, quick actions and the range switcher. */
export function DashboardHeader({ subtitle, range, pendingCount, onRangeChange, onRefresh }: Props) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? t.hero.morning : hour < 18 ? t.hero.afternoon : t.hero.evening
  const name = firstName(authSession.getUser()?.fullName)
  const today = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)

  return (
    <section className="mgr-hero">
      <div className="mgr-hero-main">
        <p className="mgr-hero-date">
          <CalendarOutlined /> {today}
        </p>
        <h1 className="mgr-hero-title">{t.title}</h1>
        <p className="mgr-hero-greet">
          {greeting}
          {name ? `, ${name}` : ''}. {t.hero.summary(pendingCount)}
        </p>
        <div className="mgr-hero-actions">
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.hero.reviewOrders}
          </Button>
          <Button
            icon={<RocketOutlined />}
            href={managerHref({ screen: 'missions' })}
          >
            {t.hero.viewMissions}
          </Button>
          <Button
            icon={<CalendarOutlined />}
            href={managerHref({ screen: 'schedule' })}
          >
            {t.hero.viewSchedule}
          </Button>
        </div>
      </div>
      <div className="mgr-hero-side">
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
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          {t.refresh}
        </Button>
        <p className="mgr-hero-updated">{subtitle}</p>
      </div>
    </section>
  )
}

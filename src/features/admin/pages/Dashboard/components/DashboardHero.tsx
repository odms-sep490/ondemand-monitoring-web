import {
  CalendarOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { authSession } from '../../../../auth/api/authApi'
import { adminHref } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

function firstName(fullName: string | undefined) {
  const words = fullName?.trim().split(/\s+/) ?? []
  return words.length ? words[words.length - 1] : ''
}

type Props = {
  alertCount: number
  updatedAt: Date | null
  refreshing: boolean
  onRefresh: () => void
}

/** Welcome banner: greeting, date, alert summary, refresh and last update time. */
export function DashboardHero({
  alertCount,
  updatedAt,
  refreshing,
  onRefresh,
}: Props) {
  const { t, locale } = useI18n(adminDashboardPageMessages)
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? t.hero.morning : hour < 18 ? t.hero.afternoon : t.hero.evening
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
          <CalendarOutlined aria-hidden="true" aria-label={undefined} /> {today}
        </p>
        <h1 className="mgr-hero-title">{t.title}</h1>
        <p className="mgr-hero-greet">
          {greeting}
          {name ? `, ${name}` : ''}. {t.hero.alerts(alertCount)}
        </p>
        <div className="mgr-hero-actions">
          <Button
            type="primary"
            icon={<UserAddOutlined aria-hidden="true" aria-label={undefined} />}
            href={adminHref({ screen: 'createAccount' })}
          >
            {t.quick.createAccount}
          </Button>
        </div>
      </div>
      <div className="mgr-hero-side">
        <Button
          icon={<ReloadOutlined aria-hidden="true" aria-label={undefined} />}
          loading={refreshing}
          onClick={onRefresh}
        >
          {t.refresh}
        </Button>
        <p className="mgr-hero-updated">
          {updatedAt
            ? `${t.updatedAt} ${updatedAt.toLocaleTimeString(locale)}`
            : ''}
        </p>
      </div>
    </section>
  )
}

import {
  CalendarOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { missionListPageMessages } from '../MissionListPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OperatorKpis } from '../../../lib/computeKpis'
import type { OperatorProfile } from '../../../types/mission'

export function KpiRow({
  kpis,
  profile,
}: {
  kpis: OperatorKpis
  profile: OperatorProfile
}) {
  const { t } = useI18n(missionListPageMessages)
  return (
    <div className="mgr-kpi-strip">
      <StatisticComponent
        index={0}
        tone="amber"
        icon={<ClockCircleOutlined />}
        title={t.kpi.pending}
        value={kpis.pendingCount}
        hint={
          kpis.pendingDeadlineLabel
            ? t.kpi.pendingSub(kpis.pendingDeadlineLabel)
            : undefined
        }
      />
      <StatisticComponent
        index={1}
        tone="blue"
        icon={<RocketOutlined />}
        title={t.kpi.today}
        value={kpis.todayCount}
        hint={
          kpis.todayFlyingCount > 0
            ? t.kpi.todayFlyingSub(kpis.todayFlyingCount)
            : undefined
        }
      />
      <StatisticComponent
        index={2}
        tone="green"
        icon={<CalendarOutlined />}
        title={t.kpi.upcomingWeek}
        value={kpis.upcomingWeekCount}
      />
      <StatisticComponent
        index={3}
        tone="violet"
        icon={<SafetyCertificateOutlined />}
        title={t.kpi.certValid}
        value={profile.certExpiry ? t.kpi.certDays(kpis.certDaysLeft) : '—'}
        hint={
          profile.certExpiry
            ? t.kpi.certExpirySub(kpis.certExpiryLabel)
            : t.kpi.certNoData
        }
      />
    </div>
  )
}

import { KpiCard } from './KpiCard'
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 14,
      }}
    >
      <KpiCard
        dotColor="var(--yellow-dot)"
        label={t.kpi.pending}
        value={kpis.pendingCount}
        sub={
          kpis.pendingDeadlineLabel
            ? t.kpi.pendingSub(kpis.pendingDeadlineLabel)
            : undefined
        }
      />
      <KpiCard
        dotColor="var(--blue-dot)"
        label={t.kpi.today}
        value={kpis.todayCount}
        sub={
          kpis.todayFlyingCount > 0
            ? t.kpi.todayFlyingSub(kpis.todayFlyingCount)
            : undefined
        }
      />
      <KpiCard
        dotColor="var(--green-dot)"
        label={t.kpi.upcomingWeek}
        value={kpis.upcomingWeekCount}
      />
      <KpiCard
        dotColor="var(--orange-dot)"
        label={t.kpi.certValid}
        value={
          profile.certExpiry
            ? t.kpi.certDays(kpis.certDaysLeft)
            : t.kpi.certNoData
        }
        sub={
          profile.certExpiry
            ? t.kpi.certExpirySub(kpis.certExpiryLabel)
            : undefined
        }
      />
    </div>
  )
}

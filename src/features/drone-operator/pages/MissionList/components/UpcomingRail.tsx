import { ThunderboltOutlined } from '@ant-design/icons'

import {
  CardComponent,
  EmptyState,
} from '../../../../../shared/components/antd'
import type { OperatorMission } from '../../../types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { missionListPageMessages } from '../MissionListPage.messages'
import {
  isRailMission,
  latestMissionStatus,
  railMissionPriority,
} from '../missionListHelpers'
import { NextFlightCard } from './NextFlightCard'

export function UpcomingRail({
  missions,
  now,
}: {
  missions: OperatorMission[]
  now: Date
}) {
  const { t } = useI18n(missionListPageMessages)
  const today = now.toISOString().slice(0, 10)
  const next = missions
    .map((m) => ({ m, start: new Date(`${m.date}T${m.startTime}:00+07:00`) }))
    .filter(({ m, start }) => isRailMission(m, start, now))
    .sort((a, b) => {
      const statusA = latestMissionStatus(a.m)
      const statusB = latestMissionStatus(b.m)
      return (
        railMissionPriority(statusA) - railMissionPriority(statusB) ||
        a.start.getTime() - b.start.getTime()
      )
    })[0]

  return (
    <CardComponent
      title={t.upcomingSoon}
      icon={<ThunderboltOutlined />}
      tone="amber"
    >
      {!next ? (
        <EmptyState title={t.noUpcomingMission} />
      ) : (
        <NextFlightCard
          mission={next.m}
          start={next.start}
          now={now}
          today={today}
        />
      )}
    </CardComponent>
  )
}

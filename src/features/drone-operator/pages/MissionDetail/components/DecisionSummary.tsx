import { SolutionOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { KeyValueList } from '../../../components/common/KeyValueList'
import type { OperatorMission } from '../../../types/mission'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import { formatCheckedAt, formatVnDate, locationLabel } from '../missionFormat'

export function DecisionSummary({ mission }: { mission: OperatorMission }) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  const time = [mission.startTime, mission.endTime].filter(Boolean).join('–')
  const items = [
    { label: t.area, value: locationLabel(mission.location, lang) },
    {
      label: t.time,
      value: [formatVnDate(mission.date, lang), time]
        .filter(Boolean)
        .join(' · '),
    },
    {
      label: t.scope,
      value:
        mission.radiusMeters == null
          ? '—'
          : t.radiusValue(Math.round(mission.radiusMeters)),
    },
    { label: t.missionType, value: mission.serviceLabel || '—' },
    ...(mission.respondBy
      ? [
          {
            label: t.respondBy,
            value: formatCheckedAt(mission.respondBy, lang),
          },
        ]
      : []),
    ...(mission.managerNote
      ? [{ label: t.managerRemark, value: mission.managerNote }]
      : []),
  ]
  return (
    <CardComponent
      title={t.decisionTitle}
      icon={<SolutionOutlined />}
      aria-label={t.decisionTitle}
    >
      <KeyValueList items={items} column={{ xs: 1, md: 2 }} />
    </CardComponent>
  )
}

import { InfoCircleOutlined } from '@ant-design/icons'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { MissionRow } from '../../../lib/missionHistory/types'
import { customerHref } from '../../../routes'
import { missionInfoCardMessages } from './MissionInfoCard.messages'

const DASH = '—'

export function MissionInfoCard({ mission }: { mission: MissionRow }) {
  const { t, locale } = useI18n(missionInfoCardMessages)
  const when = (iso: string | null) => (iso ? fmtDateTime(iso, locale) : DASH)
  const rows: Array<[string, string]> = [
    [t.address, mission.address ?? DASH],
    [t.scheduledStart, when(mission.scheduledStartAt)],
    [t.scheduledEnd, when(mission.scheduledEndAt)],
    [t.started, when(mission.startedAt)],
    [t.completed, when(mission.completedAt)],
  ]
  return (
    <Card
      icon={<InfoCircleOutlined />}
      title={t.title}
      actions={
        <a className="mgr-card-link" href={customerHref({ screen: 'orderDetail', orderId: mission.orderId })}>
          {t.viewOrder}
        </a>
      }
    >
      <dl className="mhd-fields">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {mission.description && <p className="mhd-desc">{mission.description}</p>}
    </Card>
  )
}

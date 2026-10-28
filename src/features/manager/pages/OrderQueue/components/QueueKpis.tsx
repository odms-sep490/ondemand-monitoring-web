import {
  AuditOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  FormOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

type Props = {
  pending: number
  ready: number
  /** Null while the full order list is still loading or failed to load. */
  needsInfo: number | null
  waitingDeposit: number | null
}

export function QueueKpis({ pending, ready, needsInfo, waitingDeposit }: Props) {
  const { t } = useI18n(orderQueuePageMessages)
  const show = (value: number | null) => (value === null ? '–' : value)
  return (
    <div className="mgr-kpi-strip">
      <StatisticComponent
        index={0}
        tone={pending > 0 ? 'amber' : 'blue'}
        icon={<FileSearchOutlined />}
        title={t.kpis.pending}
        value={pending}
        hint={t.kpis.pendingHint}
      />
      <StatisticComponent
        index={1}
        tone="violet"
        icon={<FormOutlined />}
        title={t.kpis.needsInfo}
        value={show(needsInfo)}
        hint={needsInfo === null ? undefined : t.kpis.needsInfoHint}
      />
      <StatisticComponent
        index={2}
        tone="blue"
        icon={<ClockCircleOutlined />}
        title={t.kpis.waitingDeposit}
        value={show(waitingDeposit)}
        hint={waitingDeposit === null ? undefined : t.kpis.waitingDepositHint}
      />
      <StatisticComponent
        index={3}
        tone={ready > 0 ? 'green' : 'blue'}
        icon={<AuditOutlined />}
        title={t.kpis.ready}
        value={ready}
        hint={t.kpis.readyHint}
      />
    </div>
  )
}

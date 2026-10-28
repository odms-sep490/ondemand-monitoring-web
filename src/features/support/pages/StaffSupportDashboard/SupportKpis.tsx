import {
  CheckCircleOutlined,
  CustomerServiceOutlined,
  HourglassOutlined,
  SyncOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import type { QueueCounts } from './supportMetrics'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

type Props = {
  counts: QueueCounts
  statusFilter: string
  onFilter: (status: string) => void
}

/** Queue counters; each tile doubles as a status filter. */
export function SupportKpis({ counts, statusFilter, onFilter }: Props) {
  const { t } = useI18n(staffSupportMessages)
  const tiles = [
    {
      key: 'OPEN',
      tone: 'blue',
      icon: <CustomerServiceOutlined />,
      title: t.kpi.open,
      hint: t.kpi.openHint,
      value: counts.open,
    },
    {
      key: 'IN_PROGRESS',
      tone: 'amber',
      icon: <SyncOutlined />,
      title: t.kpi.inProgress,
      hint: t.kpi.inProgressHint,
      value: counts.inProgress,
    },
    {
      key: 'WAITING_FOR_CUSTOMER',
      tone: 'violet',
      icon: <HourglassOutlined />,
      title: t.kpi.waiting,
      hint: t.kpi.waitingHint,
      value: counts.waitingCustomer,
    },
    {
      key: 'RESOLVED',
      tone: 'green',
      icon: <CheckCircleOutlined />,
      title: t.kpi.resolved,
      hint: t.kpi.resolvedHint,
      value: counts.resolved,
    },
  ] as const

  return (
    <div className="mgr-kpi-strip sd-kpis">
      {tiles.map((tile, index) => (
        <button
          key={tile.key}
          type="button"
          className={`sd-kpi${statusFilter === tile.key ? ' is-active' : ''}`}
          aria-pressed={statusFilter === tile.key}
          title={tile.hint}
          onClick={() => onFilter(tile.key)}
        >
          <StatisticComponent
            index={index}
            tone={tile.tone}
            icon={tile.icon}
            title={tile.title}
            value={tile.value}
          />
        </button>
      ))}
    </div>
  )
}

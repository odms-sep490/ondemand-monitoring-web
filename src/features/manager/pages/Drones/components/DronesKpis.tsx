import {
  CheckCircleOutlined,
  PauseCircleOutlined,
  SendOutlined,
  ToolOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DroneGroup } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'

export function DronesKpis({ counts }: { counts: Record<DroneGroup, number> }) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div className="mgr-kpi-strip">
      <StatisticComponent
        index={0}
        tone={counts.available > 0 ? 'green' : 'blue'}
        icon={<CheckCircleOutlined />}
        title={t.stats.available}
        value={counts.available}
        hint={t.stats.availableHint}
      />
      <StatisticComponent
        index={1}
        tone="blue"
        icon={<SendOutlined />}
        title={t.stats.inMission}
        value={counts.inMission}
        hint={t.stats.inMissionHint}
      />
      <StatisticComponent
        index={2}
        tone={counts.maintenance > 0 ? 'amber' : 'blue'}
        icon={<ToolOutlined />}
        title={t.stats.maintenance}
        value={counts.maintenance}
        hint={t.stats.maintenanceHint}
      />
      <StatisticComponent
        index={3}
        tone={counts.outOfService > 0 ? 'red' : 'blue'}
        icon={<PauseCircleOutlined />}
        title={t.stats.outOfService}
        value={counts.outOfService}
        hint={t.stats.outOfServiceHint}
      />
    </div>
  )
}

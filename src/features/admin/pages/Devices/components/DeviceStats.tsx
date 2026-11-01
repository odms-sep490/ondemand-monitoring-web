import {
  CheckCircleOutlined,
  DisconnectOutlined,
  RobotOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Skeleton } from 'antd'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceStats as Stats } from '../../../lib/deviceMappers'
import { devicesPageMessages } from '../DevicesPage.messages'

const SKELETON = <Skeleton.Button active size="small" aria-busy="true" />

/** KPI strip: total / available / maintenance / offline (`null` = loading). */
export function DeviceStats({ stats }: { stats: Stats | null }) {
  const { t } = useI18n(devicesPageMessages)
  const loading = (value: number | undefined) => ({
    value,
    formatter: stats ? undefined : () => SKELETON,
  })
  return (
    <div
      className="mgr-kpi-strip adm-kpi-strip is-quad"
      aria-label={t.statHint}
    >
      <StatisticComponent
        index={0}
        tone="blue"
        icon={<RobotOutlined aria-hidden="true" aria-label={undefined} />}
        title={t.statTotal}
        hint={t.statHint}
        className="adm-stat is-blue"
        {...loading(stats?.total)}
      />
      <StatisticComponent
        index={1}
        tone="green"
        icon={<CheckCircleOutlined aria-hidden="true" aria-label={undefined} />}
        title={t.statAvailable}
        className="adm-stat is-green"
        {...loading(stats?.available)}
      />
      <StatisticComponent
        index={2}
        tone="amber"
        icon={<ToolOutlined aria-hidden="true" aria-label={undefined} />}
        title={t.statMaintenance}
        className="adm-stat is-amber"
        {...loading(stats?.maintenance)}
      />
      <StatisticComponent
        index={3}
        tone="red"
        icon={<DisconnectOutlined aria-hidden="true" aria-label={undefined} />}
        title={t.statOffline}
        className="adm-stat is-red"
        {...loading(stats?.offline)}
      />
    </div>
  )
}

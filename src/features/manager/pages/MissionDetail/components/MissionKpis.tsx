import {
  ClockCircleOutlined,
  CheckSquareOutlined,
  PictureOutlined,
  TeamOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'

const ICONS = [<TeamOutlined />, <PictureOutlined />, <ClockCircleOutlined />, <CheckSquareOutlined />]
const TONES = ['blue', 'violet', 'amber', 'green'] as const

export function MissionKpis({
  kpis,
}: {
  kpis: { label: string; value: string }[]
}) {
  return (
    <div className="mgr-kpi-strip">
      {kpis.map((item, index) => (
        <StatisticComponent
          key={item.label}
          index={index}
          tone={TONES[index % TONES.length]}
          icon={ICONS[index % ICONS.length]}
          title={item.label}
          className={item.value.length > 8 ? 'mgr-stat-long' : ''}
          value={item.value}
        />
      ))}
    </div>
  )
}

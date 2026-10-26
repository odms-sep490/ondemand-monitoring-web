import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
  RocketOutlined,
  ToolOutlined,
} from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionsPageMessages } from '../MissionsPage.messages'
import type { MissionGroup } from '../missionsHelpers'

export function MissionsKpis({ counts }: { counts: Record<MissionGroup, number> }) {
  const { t } = useI18n(missionsPageMessages)
  return (
    <div className="mgr-kpi-strip mgr-kpi-strip-5">
      <StatisticComponent index={0} tone="blue" icon={<ToolOutlined />} title={t.kpis.preparing} value={counts.preparing} />
      <StatisticComponent index={1} tone="green" icon={<RocketOutlined />} title={t.kpis.running} value={counts.running} />
      <StatisticComponent index={2} tone="amber" icon={<FileSearchOutlined />} title={t.kpis.review} value={counts.review} />
      <StatisticComponent index={3} tone="violet" icon={<CheckCircleOutlined />} title={t.kpis.completed} value={counts.completed} />
      <StatisticComponent index={4} tone="red" icon={<CloseCircleOutlined />} title={t.kpis.failed} value={counts.failed} />
    </div>
  )
}

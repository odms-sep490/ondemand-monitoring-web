import { FolderOpenOutlined } from '@ant-design/icons'

import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaMissionGroup } from '../../../lib/media/types'
import { missionSidebarMessages } from './MissionSidebar.messages'

type Props = {
  groups: MediaMissionGroup[]
  total: number
  selected: string | null
  onSelect: (missionId: string | null) => void
}

export function MissionSidebar({ groups, total, selected, onSelect }: Props) {
  const { t } = useI18n(missionSidebarMessages)
  const item = (id: string | null, label: string, count: number) => (
    <li key={id ?? 'all'} className={id === null && groups.length > 0 ? 'ml-mission-all' : undefined}>
      <button
        type="button"
        className={`ml-mission${selected === id ? ' is-active' : ''}`}
        aria-pressed={selected === id}
        onClick={() => onSelect(id)}
      >
        <span className="ml-mission-label">{label}</span>
        <span className="ml-mission-count">{count}</span>
      </button>
    </li>
  )
  return (
    <Card title={t.heading} className="ml-sidebar" icon={<FolderOpenOutlined />}>
      <ul className="ml-missions">
        {item(null, t.all, total)}
        {groups.map((g) => item(g.missionId, g.label, g.count))}
      </ul>
    </Card>
  )
}

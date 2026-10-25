import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionDetailTab } from '../missionDetailTypes'
import type { Dispatch, SetStateAction } from 'react'

export function MissionDetailTabs({
  tabs,
  activeTab,
  setTab,
}: {
  tabs: { id: MissionDetailTab; label: string }[]
  activeTab: MissionDetailTab
  setTab: Dispatch<SetStateAction<MissionDetailTab>>
}) {
  const { t } = useI18n(missionDetailPageMessages)
  return (
    <div className="odm-or-seg" role="tablist" aria-label={t.tabsAria}>
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeTab === item.id}
          className={`odm-or-seg-btn${activeTab === item.id ? ' is-active' : ''}`}
          onClick={() => setTab(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

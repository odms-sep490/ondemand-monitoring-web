import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionDetailTab } from '../missionDetailTypes'
import '../../../components/layout/mgrLayout.css'
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
  const selectTab = (id: MissionDetailTab) => {
    setTab(id)
    document.getElementById(`mission-detail-tab-${id}`)?.focus()
  }

  return (
    <div
      className="mgr-seg mgr-md-tabs"
      role="tablist"
      aria-label={t.tabsAria}
    >
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`mission-detail-tab-${item.id}`}
          aria-selected={activeTab === item.id}
          aria-controls="mission-detail-panel"
          tabIndex={activeTab === item.id ? 0 : -1}
          className={activeTab === item.id ? 'is-active' : ''}
          onClick={() => setTab(item.id)}
          onKeyDown={(event) => {
            const currentIndex = tabs.findIndex((tab) => tab.id === item.id)
            let nextIndex: number | null = null
            if (event.key === 'ArrowRight') {
              nextIndex = (currentIndex + 1) % tabs.length
            } else if (event.key === 'ArrowLeft') {
              nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
            } else if (event.key === 'Home') {
              nextIndex = 0
            } else if (event.key === 'End') {
              nextIndex = tabs.length - 1
            }
            if (nextIndex !== null) {
              event.preventDefault()
              selectTab(tabs[nextIndex].id)
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

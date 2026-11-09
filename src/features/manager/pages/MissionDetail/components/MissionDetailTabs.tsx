import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { useEffect } from 'react'
import type { MissionDetailTab } from '../missionDetailTypes'
import '../../../components/layout/mgrLayout.css'

export function MissionDetailTabs({
  tabs,
  activeTab,
  setTab,
  resourceUnreadCount = 0,
}: {
  tabs: { id: MissionDetailTab; label: string }[]
  activeTab: MissionDetailTab
  setTab: (tab: MissionDetailTab) => void
  resourceUnreadCount?: number
}) {
  const { t } = useI18n(missionDetailPageMessages)
  useEffect(() => {
    document
      .getElementById(`mission-detail-tab-${activeTab}`)
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [activeTab])
  const selectTab = (id: MissionDetailTab) => {
    setTab(id)
    const tab = document.getElementById(`mission-detail-tab-${id}`)
    tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    tab?.focus()
  }

  return (
    <div
      className="mgr-seg mgr-md-tabs"
      role="tablist"
      aria-label={t.tabsAria}
      aria-orientation="horizontal"
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
          onClick={() => selectTab(item.id)}
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
          {item.id === 'resources' && resourceUnreadCount > 0 ? (
            <span
              className="mgr-menu-count mgr-md-tab-count"
              role="status"
              aria-label={t.unreadResourceEvents(resourceUnreadCount)}
            >
              {resourceUnreadCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'

export function MediaTabs({
  manualCount,
  badCount,
  waitCount,
  activeTab,
  setActiveTab,
}: {
  manualCount: number
  badCount: number
  waitCount: number
  activeTab: 'man' | 'bad' | 'wait'
  setActiveTab: Dispatch<SetStateAction<'man' | 'bad' | 'wait'>>
}) {
  const { t } = useI18n(mediaPageMessages)
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 2,
        borderBottom: '1px solid var(--bd)',
        marginBottom: 14,
      }}
    >
      {(
        [
          { id: 'man', label: t.tabs.manual, count: manualCount },
          { id: 'bad', label: t.tabs.bad, count: badCount },
          { id: 'wait', label: t.tabs.wait, count: waitCount },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            height: 38,
            padding: '0 14px',
            border: 0,
            borderBottom:
              activeTab === tab.id
                ? '2px solid var(--ink)'
                : '2px solid transparent',
            marginBottom: -1,
            background: 'transparent',
            font: "600 13px 'IBM Plex Sans',system-ui,sans-serif",
            color: activeTab === tab.id ? 'var(--tx)' : 'var(--tx3)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {tab.label}
          <span
            style={{
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 9,
              background: 'var(--sf3)',
              color: 'var(--tx2)',
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}

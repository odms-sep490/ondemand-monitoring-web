import { ActiveMissionItem } from './ActiveMissionItem'
import { livePageMessages } from '../LivePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch, SetStateAction } from 'react'

export function LiveSidebar({
  activeMissions,
  listQuery,
  selected,
  setSelectedId,
}: {
  activeMissions: MissionCalendarItem[]
  listQuery: UseApiQueryState<{ items: MissionCalendarItem[] }>
  selected: MissionCalendarItem | null
  setSelectedId: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(livePageMessages)
  return (
    <div className="odm-live-sidebar">
      <div className="odm-live-sidebar-head">
        {t.sidebar.activeMissions}
        {activeMissions.length > 0 && (
          <span
            style={{
              marginLeft: 6,
              background: 'var(--blue-solid)',
              color: 'var(--blue-on)',
              borderRadius: 10,
              fontSize: 11,
              padding: '1px 6px',
              fontWeight: 600,
            }}
          >
            {activeMissions.length}
          </span>
        )}
      </div>

      {listQuery.loading && (
        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          aria-busy="true"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="odm-sk"
              style={{ height: 68, borderRadius: 6 }}
            />
          ))}
        </div>
      )}

      {!listQuery.loading && !!listQuery.error && (
        <div
          style={{ padding: 16, fontSize: 12, color: 'var(--red-fg)' }}
          role="alert"
        >
          {t.sidebar.loadError}
          <button
            type="button"
            className="odm-btn"
            style={{ display: 'block', marginTop: 8 }}
            onClick={listQuery.reload}
          >
            {t.sidebar.retry}
          </button>
        </div>
      )}

      {!listQuery.loading &&
        !listQuery.error &&
        activeMissions.length === 0 && (
          <div
            style={{
              padding: 16,
              fontSize: 12,
              color: 'var(--tx3)',
              textAlign: 'center',
            }}
          >
            {t.sidebar.noActiveMissions}
          </div>
        )}

      {activeMissions.map((m) => (
        <ActiveMissionItem
          key={m.id}
          mission={m}
          selected={selected?.id === m.id}
          onSelect={() => setSelectedId(m.id)}
        />
      ))}
    </div>
  )
}

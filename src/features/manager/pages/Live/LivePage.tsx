import { useCallback, useEffect, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import { managerHref } from '../../routes'
import { livePageMessages } from './LivePage.messages'
import '../../manager.css'
import { ACTIVE_STATUSES } from './liveHelpers'
import { LiveMainPanel } from './components/LiveMainPanel'
import { LiveSidebar } from './components/LiveSidebar'

// ── LivePage ───────────────────────────────────────────────────────────────

export function LivePage({ missionId }: { missionId?: string }) {
  const { t } = useI18n(livePageMessages)
  // Load all active missions for the sidebar
  const listQuery = useApiQuery((signal) => {
    // We want missions that are active — no status filter since the API
    // doesn't support multi-value; filter client-side.
    return missionsApi.listMissions({ signal })
  }, [])

  const activeMissions = (listQuery.data?.items ?? []).filter((m) =>
    ACTIVE_STATUSES.has(m.status),
  )

  // Selected mission: prefer URL param → first active
  const [selectedId, setSelectedId] = useState<string | null>(missionId ?? null)

  const selected = activeMissions.find((m) => m.id === selectedId) ?? null
  useEffect(() => {
    if (!selectedId && !missionId && !listQuery.loading && !listQuery.error)
      setSelectedId(activeMissions.at(0)?.id ?? null)
  }, [
    selectedId,
    missionId,
    listQuery.loading,
    listQuery.error,
    activeMissions,
  ])

  // When a mission is cancelled, deselect it and reload
  const handleCancelled = useCallback(() => {
    setSelectedId(null)
    listQuery.reload()
  }, [listQuery])

  return (
    <div className="odm-live" aria-label={t.sidebar.ariaLabel}>
      {/* Left sidebar */}
      <LiveSidebar
        activeMissions={activeMissions}
        listQuery={listQuery}
        selected={selected}
        setSelectedId={setSelectedId}
      />

      {/* Main panel */}
      <div className="odm-live-main">
        {selected ? (
          <LiveMainPanel
            key={selected.id}
            mission={selected}
            onCancelled={handleCancelled}
          />
        ) : (
          !listQuery.loading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--tx3)',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 40 }}>📡</div>
              <div style={{ fontWeight: 600 }}>
                {t.emptyState.selectMission}
              </div>
              <div style={{ fontSize: 13 }}>
                {t.emptyState.noFlying}{' '}
                <a
                  href={managerHref({ screen: 'schedule' })}
                  style={{ color: 'var(--focus)' }}
                >
                  {t.emptyState.viewSchedule}
                </a>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

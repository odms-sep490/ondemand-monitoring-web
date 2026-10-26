// MNG-08: Mission list + detail panel
import { useEffect, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { CardComponent } from '../../../../shared/components/antd'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterBar, FilterSegments } from '../../components/common/FilterBar'
import { PageHeader } from '../../components/common/PageHeader'
import type { MissionCalendarItem } from '../../types/missions'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import { missionsPageMessages } from './MissionsPage.messages'
import '../../components/layout/mgrLayout.css'
import '../../manager.css'
import './missions.scss'
import { type DeliveryStatus, type StatusChip } from './missionsTypes'
import { DetailPanel } from './components/DetailPanel'
import { useMissionDeliveryStatuses } from './useMissionDeliveryStatuses'
import { MissionsKpis } from './components/MissionsKpis'
import { MissionsTable } from './components/MissionsTable'
import { groupCounts, matchesMissionSearch } from './missionsHelpers'

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsPage({ missionId }: MissionsListPageProps) {
  const { t, locale } = useI18n(missionsPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [selectedMission, setSelectedMission] = useState<string | null>(
    missionId ?? null,
  )
  const [deliveryStatuses, setDeliveryStatuses] = useState<
    Record<string, DeliveryStatus>
  >({})

  const statusChips: Array<{ value: StatusChip; label: string }> = [
    { value: 'ALL', label: t.statusChips.ALL },
    { value: 'IN_FLIGHT', label: t.statusChips.IN_FLIGHT },
    { value: 'COMPLETED', label: t.statusChips.COMPLETED },
    { value: 'FAILED', label: t.statusChips.FAILED },
    { value: 'CREATED', label: t.statusChips.CREATED },
  ]

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )
  const missions = useMemo(() => query.data?.items ?? [], [query.data?.items])
  // KPI counts always describe the whole list, even while a status filter is applied.
  const [snapshot, setSnapshot] = useState<MissionCalendarItem[] | null>(null)
  useEffect(() => {
    if (statusFilter === 'ALL' && query.data) setSnapshot(query.data.items)
  }, [statusFilter, query.data])
  const [search, setSearch] = useState('')
  const selected =
    missions.find((mission) => mission.id === selectedMission) ?? null
  const [orderDeliveryStatuses, setOrderDeliveryStatuses] = useState<
    Record<string, WorkflowDeliveryStatus>
  >({})
  useMissionDeliveryStatuses({
    missions,
    setOrderDeliveryStatuses,
    setDeliveryStatuses,
    missionId,
    setSelectedMission,
  })

  const snapshotCounts = useMemo(
    () => groupCounts(snapshot ?? missions),
    [snapshot, missions],
  )
  const visible = useMemo(
    () => missions.filter((mission) => matchesMissionSearch(mission, search)),
    [missions, search],
  )
  const ready = !query.loading && !query.error

  return (
    <div className="mgr-view mgr-missions">
      <PageHeader
        title={t.title}
        description={ready ? t.missionCount(missions.length) : undefined}
      />

      <MissionsKpis counts={snapshotCounts} />

      <FilterBar
        start={
          <FilterSegments<StatusChip>
            ariaLabel={t.statusAria}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusChips}
          />
        }
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t.searchPlaceholder,
          ariaLabel: t.searchAria,
        }}
      />

      <div className={`mgr-list-grid${selectedMission ? ' has-panel' : ''}`}>
        <div className="mgr-detail-main">
          {query.loading && (
            <CardComponent aria-busy="true">
              <Skeleton active paragraph={{ rows: 6 }} />
            </CardComponent>
          )}

          {!query.loading && !!query.error && (
            <ErrorState title={t.loadError} description={t.loadErrorDetail} onRetry={query.reload} />
          )}

          {ready && visible.length === 0 && (
            <CardComponent>
              <EmptyState
                title={missions.length === 0 ? t.emptyTitle : t.emptySearch}
                description={missions.length === 0 ? t.emptyDescription : undefined}
              />
            </CardComponent>
          )}

          {ready && visible.length > 0 && (
            <MissionsTable
              missions={visible}
              total={missions.length}
              selectedMission={selectedMission}
              setSelectedMission={setSelectedMission}
              deliveryStatuses={deliveryStatuses}
              orderDeliveryStatuses={orderDeliveryStatuses}
            />
          )}
        </div>

        {selected && (
          <DetailPanel
            key={selected.id}
            mission={selected}
            onClose={() => setSelectedMission(null)}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}

// Re-export missionId for ManagerApp
export type { MissionsListPageProps }

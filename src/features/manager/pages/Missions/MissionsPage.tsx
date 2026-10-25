// MNG-08: Mission list + detail panel
import { useMemo, useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import { missionsPageMessages } from './MissionsPage.messages'
import '../../manager.css'
import { type DeliveryStatus, type StatusChip } from './missionsTypes'
import { DetailPanel } from './components/DetailPanel'
import { useMissionDeliveryStatuses } from './useMissionDeliveryStatuses'
import { MissionsTable } from './components/MissionsTable'

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

  const columns = [
    t.columns.mission,
    t.columns.order,
    t.columns.attempt,
    t.columns.schedule,
    t.columns.drone,
    t.columns.operator,
    t.columns.status,
    t.columns.delivery,
    '',
  ]

  return (
    <div className="odm-or">
      <div className="odm-or-pagehead">
        <h1 className="odm-or-title">{t.title}</h1>
        <p className="odm-or-subtitle">
          {!query.loading && !query.error
            ? t.missionCount(missions.length)
            : ' '}
        </p>
      </div>

      <div className="odm-or-filters" role="group" aria-label={t.title}>
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`odm-or-filter${statusFilter === chip.value ? ' is-active' : ''}`}
            aria-pressed={statusFilter === chip.value}
            onClick={() => setStatusFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div
        className={`odm-or-list-layout${selectedMission ? ' has-panel' : ''}`}
      >
        <div className="odm-or-col">
          {query.loading && (
            <div aria-busy="true">
              <span className="odm-sk" style={{ width: '100%', height: 260 }} />
            </div>
          )}

          {!query.loading && !!query.error && (
            <section className="odm-or-card">
              <div className="odm-or-card-body">
                <StateView
                  state="error"
                  title={t.loadError}
                  error="Không thể tải danh sách nhiệm vụ. Vui lòng thử lại."
                  onRetry={query.reload}
                />
              </div>
            </section>
          )}

          {!query.loading && !query.error && missions.length === 0 && (
            <section className="odm-or-card">
              <StateView
                state="empty"
                title={t.emptyTitle}
                description={t.emptyDescription}
              />
            </section>
          )}

          {!query.loading && !query.error && missions.length > 0 && (
            <MissionsTable
              columns={columns}
              missions={missions}
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

// MNG-09: Drone fleet management page
import { useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { dronesApi } from '../../api/dronesApi'
import type { DroneResponse } from '../../types/drones'
import { dronesPageMessages } from './DronesPage.messages'
import '../../manager.css'
import { type FilterChip, matchesFilter } from './droneHelpers'
import { StatusChangeModal } from './components/StatusChangeModal'
import { DronesStats } from './components/DronesStats'
import { DroneFilterChips } from './components/DroneFilterChips'
import { DronesTable } from './components/DronesTable'

type DronesPageProps = {
  droneId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DronesPage({ droneId: _droneId }: DronesPageProps) {
  const { t } = useI18n(dronesPageMessages)
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [changingDrone, setChangingDrone] = useState<DroneResponse | null>(null)
  const [drones, setDrones] = useState<DroneResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = drones ?? query.data?.items ?? []
  const visible = allDrones.filter((d) => matchesFilter(d, filter))

  const counts = {
    available: allDrones.filter((d) => d.status === 'AVAILABLE').length,
    flying: allDrones.filter(
      (d) =>
        d.status === 'IN_MISSION' ||
        d.status === 'RESERVED' ||
        d.status === 'RETURNING',
    ).length,
    maintenance: allDrones.filter((d) => d.status === 'MAINTENANCE').length,
    outOfService: allDrones.filter((d) => d.status === 'OUT_OF_SERVICE').length,
  }

  function handleChanged(updated: DroneResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          {!query.loading && !query.error && (
            <div className="odm-mgr-dash-date" style={{ fontSize: 13 }}>
              {t.summary(
                counts.available,
                counts.flying,
                counts.maintenance,
                counts.outOfService,
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <DronesStats filter={filter} setFilter={setFilter} />

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 8 }} />
        </div>
      )}

      {!query.loading && !!query.error && <DroneFilterChips query={query} />}

      {!query.loading && !query.error && visible.length === 0 && (
        <StateView
          state="empty"
          title={t.emptyTitle}
          description={t.emptyDescription}
        />
      )}

      {!query.loading && !query.error && visible.length > 0 && (
        <DronesTable visible={visible} setChangingDrone={setChangingDrone} />
      )}

      {/* Status change modal */}
      {changingDrone && (
        <StatusChangeModal
          drone={changingDrone}
          onClose={() => setChangingDrone(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  )
}

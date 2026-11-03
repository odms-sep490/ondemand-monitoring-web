// MNG-09: Drone fleet management page
import { useMemo, useState } from 'react'
import {
  AppstoreOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { Button, Segmented, Space } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../shared/lib/statusTone'
import { dronesApi } from '../../api/dronesApi'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterBar, FilterSegments } from '../../components/common/FilterBar'
import { PageHeader } from '../../components/common/PageHeader'
import type { DeviceResponse } from '../../types/drones'
import { dronesPageMessages } from './DronesPage.messages'
import '../../manager.css'
import './drones.scss'
import {
  FILTER_CHIP_VALUES,
  type FilterChip,
  groupCounts,
  matchesFilter,
  matchesSearch,
} from './droneHelpers'
import { DroneGrid } from './components/DroneGrid'
import { DronesKpis } from './components/DronesKpis'
import { DronesSkeleton } from './components/DronesSkeleton'
import { DronesTable } from './components/DronesTable'
import { StatusChangeModal } from './components/StatusChangeModal'
import { CreateDroneModal } from './components/CreateDroneModal'

type DronesPageProps = {
  droneId?: string
}

type ViewMode = 'grid' | 'table'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DronesPage({ droneId: _droneId }: DronesPageProps) {
  const { t, lang } = useI18n(dronesPageMessages)
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('grid')
  const [changingDrone, setChangingDrone] = useState<DeviceResponse | null>(
    null,
  )
  const [creatingDrone, setCreatingDrone] = useState(false)
  const [drones, setDrones] = useState<DeviceResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = useMemo(
    () => drones ?? query.data?.items ?? [],
    [drones, query.data?.items],
  )
  const searched = useMemo(
    () => allDrones.filter((d) => matchesSearch(d, search)),
    [allDrones, search],
  )
  const visible = useMemo(
    () => searched.filter((d) => matchesFilter(d, filter)),
    [searched, filter],
  )
  const counts = useMemo(() => groupCounts(allDrones), [allDrones])
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: searched.length }
    for (const d of searched) map[d.status] = (map[d.status] ?? 0) + 1
    return map
  }, [searched])

  function handleChanged(updated: DeviceResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  function handleCreated(created: DeviceResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones([created, ...base])
    setFilter('ALL')
    setSearch('')
    setCreatingDrone(false)
  }

  const ready = !query.loading && !query.error

  // Hide statuses nobody is in, so the filter row stays short.
  const chipOptions = FILTER_CHIP_VALUES.filter(
    (chip) =>
      chip === 'ALL' || chip === filter || (statusCounts[chip] ?? 0) > 0,
  ).map((chip) => ({
    value: chip,
    label: chip === 'ALL' ? t.filterAll : getDroneStatusLabel(chip, lang),
    count: statusCounts[chip] ?? 0,
  }))

  return (
    <div className="mgr-view mgr-drones">
      <PageHeader
        title={t.title}
        description={ready ? t.subtitle(allDrones.length) : undefined}
        actions={
          <Space wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!ready}
              onClick={() => setCreatingDrone(true)}
            >
              {t.create}
            </Button>
            <Segmented<ViewMode>
              aria-label={t.view.aria}
              value={view}
              onChange={setView}
              options={[
                {
                  value: 'grid',
                  icon: <AppstoreOutlined />,
                  label: t.view.grid,
                },
                {
                  value: 'table',
                  icon: <TableOutlined />,
                  label: t.view.table,
                },
              ]}
            />
          </Space>
        }
      />

      {ready ? <DronesKpis counts={counts} /> : null}

      <FilterBar
        start={
          <FilterSegments<FilterChip>
            ariaLabel={t.filterAria}
            value={filter}
            onChange={setFilter}
            options={chipOptions}
          />
        }
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t.searchPlaceholder,
          ariaLabel: t.searchAria,
        }}
      />

      {query.loading && <DronesSkeleton />}

      {!query.loading && !!query.error && (
        <ErrorState
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
      )}

      {ready && visible.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}

      {ready && visible.length > 0 && view === 'grid' && (
        <DroneGrid
          visible={visible}
          total={allDrones.length}
          onChangeStatus={setChangingDrone}
        />
      )}
      {ready && visible.length > 0 && view === 'table' && (
        <DronesTable
          visible={visible}
          total={allDrones.length}
          onChangeStatus={setChangingDrone}
        />
      )}

      {changingDrone && (
        <StatusChangeModal
          drone={changingDrone}
          onClose={() => setChangingDrone(null)}
          onChanged={handleChanged}
        />
      )}

      {creatingDrone ? (
        <CreateDroneModal
          onClose={() => setCreatingDrone(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  )
}

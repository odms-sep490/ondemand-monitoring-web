import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { EmptyState } from '../../../../../shared/components/ui'
import { MockDataBadge } from '../../../../../shared/components/ui'
import { TableCard } from '../../../../../shared/components/ui'
import type { AdminStation } from '../../../types/catalog'
import { StationModal } from './StationModal'
import { StationsTable } from './StationsTable'
import { stationsTabMessages } from './StationsTab.messages'
import { Toolbar } from './Toolbar'
import { useCatalogFilter } from './useCatalogFilter'
import { CatalogNoResults } from './CatalogNoResults'

export function StationsTab() {
  const { t } = useI18n(stationsTabMessages)
  const [dialog, setDialog] = useState<{ station?: AdminStation } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listStations(signal),
    [],
  )
  const { rows, controls } = useCatalogFilter(
    data?.items,
    (item) => `${item.name} ${item.code} ${item.address}`,
    (item) => item.isActive,
  )

  async function handleToggle(station: AdminStation) {
    setTogglingId(station.id)
    try {
      await adminApi.toggleStationActive(station.id, !station.isActive)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="catalog-tab-content">
      <Toolbar
        badge={<MockDataBadge />}
        createLabel={t.add}
        onCreate={() => setDialog({})}
        filters={controls}
        total={error === undefined ? data?.items.length : undefined}
        visible={rows.length}
        loading={loading}
        onReload={reload}
      />
      {loading && !data && <LoadingState />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && !loading && error === undefined && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data &&
        data.items.length > 0 &&
        rows.length === 0 &&
        !loading &&
        error === undefined && <CatalogNoResults reset={controls.reset} />}
      {data && rows.length > 0 && error === undefined && (
        <TableCard>
          <StationsTable
            items={rows}
            togglingId={togglingId}
            onEdit={(station) => setDialog({ station })}
            onToggle={handleToggle}
          />
        </TableCard>
      )}
      {dialog && (
        <StationModal
          station={dialog.station}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

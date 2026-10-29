import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  ErrorState,
} from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { AdminLoading } from '../../../components/common/AdminLoading'
import { MockDataTag } from '../../../components/common/MockDataTag'
import type { AdminStation } from '../../../types/catalog'
import { StationModal } from './StationModal'
import { StationsTable } from './StationsTable'
import { stationsTabMessages } from './StationsTab.messages'
import { Toolbar } from './Toolbar'

export function StationsTab() {
  const { t } = useI18n(stationsTabMessages)
  const [dialog, setDialog] = useState<{ station?: AdminStation } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listStations(signal),
    [],
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
    <div className="mgr-view">
      <Toolbar badge={<MockDataTag />} createLabel={t.add} onCreate={() => setDialog({})} />
      {loading && !data && <AdminLoading />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.items.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <StationsTable
            items={data.items}
            togglingId={togglingId}
            onEdit={(station) => setDialog({ station })}
            onToggle={handleToggle}
          />
        </CardComponent>
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

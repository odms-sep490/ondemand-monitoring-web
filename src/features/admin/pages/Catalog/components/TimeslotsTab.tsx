import { useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { EmptyState } from '../../../../../shared/components/ui'
import { TableCard } from '../../../../../shared/components/ui'
import { mapTimeslot } from '../../../lib/catalogMappers'
import type { AdminTimeslot } from '../../../types/catalog'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { TimeslotModal } from './TimeslotModal'
import { TimeslotsTable } from './TimeslotsTable'
import { timeslotsTabMessages } from './TimeslotsTab.messages'
import { Toolbar } from './Toolbar'
import { useCatalogFilter } from './useCatalogFilter'
import { CatalogNoResults } from './CatalogNoResults'
import { timeslotCodeMessages } from './timeslotCodes'

type Dialog =
  | { type: 'form'; timeslot?: AdminTimeslot }
  | { type: 'delete'; timeslot: AdminTimeslot }
  | null

export function TimeslotsTab() {
  const { t } = useI18n(timeslotsTabMessages)
  const { t: codes } = useI18n(timeslotCodeMessages)
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      catalogApi.listPreferredTimes(signal).then((r) => r.map(mapTimeslot)),
    [],
  )
  const { rows, controls } = useCatalogFilter(
    data,
    (item) =>
      `${item.code} ${item.name} ${codes[item.code] ?? ''} ${item.startTime} ${item.endTime}`,
  )

  function done() {
    setDialog(null)
    reload()
  }

  return (
    <div className="catalog-tab-content">
      <Toolbar
        createLabel={t.add}
        onCreate={() => setDialog({ type: 'form' })}
        filters={controls}
        total={error === undefined ? data?.length : undefined}
        visible={rows.length}
        loading={loading}
        onReload={reload}
      />
      {loading && !data && <LoadingState />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.length === 0 && !loading && error === undefined && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data &&
        data.length > 0 &&
        rows.length === 0 &&
        !loading &&
        error === undefined && <CatalogNoResults reset={controls.reset} />}
      {data && rows.length > 0 && error === undefined && (
        <TableCard>
          <TimeslotsTable
            items={rows}
            onEdit={(timeslot) => setDialog({ type: 'form', timeslot })}
            onDelete={(timeslot) => setDialog({ type: 'delete', timeslot })}
          />
        </TableCard>
      )}
      {dialog?.type === 'form' && (
        <TimeslotModal
          timeslot={dialog.timeslot}
          onClose={() => setDialog(null)}
          onSaved={done}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteConfirmModal
          title={t.deleteTitle}
          name={dialog.timeslot.name}
          onConfirm={() => catalogApi.deletePreferredTime(dialog.timeslot.id)}
          onClose={() => setDialog(null)}
          onDeleted={done}
        />
      )}
    </div>
  )
}
